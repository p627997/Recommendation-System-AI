from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.db import models
from django.db.models import Count, F
from django.utils import timezone
from datetime import timedelta

from blog.models import Blog
from blog.serializers import BlogListSerializer
from .engine import get_recommendation_engine


class RecommendationsView(APIView):
    """Get personalized recommendations for the current user."""
    permission_classes = [AllowAny]

    def get(self, request):
        blog_slug = request.query_params.get('blog')
        n = int(request.query_params.get('limit', 6))

        engine = get_recommendation_engine()

        # Get current blog ID if provided
        blog_id = None
        if blog_slug:
            try:
                blog_id = Blog.objects.get(slug=blog_slug).id
            except Blog.DoesNotExist:
                pass

        # Get user ID if authenticated
        user_id = request.user.id if request.user.is_authenticated else None

        # Get hybrid recommendations
        if engine.content_index or engine.collab_index:
            recommendations = engine.get_hybrid_recommendations(
                user_id=user_id,
                blog_id=blog_id,
                n_recommendations=n
            )
            blog_ids = [r['blog_id'] for r in recommendations]
        else:
            # Fallback to popular blogs if no index exists
            blog_ids = []

        if blog_ids:
            # Preserve order from recommendations with optimized query
            blogs = Blog.objects.published_with_relations().filter(id__in=blog_ids)
            blog_dict = {b.id: b for b in blogs}
            ordered_blogs = [blog_dict[bid] for bid in blog_ids if bid in blog_dict]
        else:
            # Fallback to recent popular blogs
            ordered_blogs = Blog.objects.published_with_relations().order_by(
                '-views_count', '-created_at'
            )[:n]

        serializer = BlogListSerializer(
            ordered_blogs,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class SimilarBlogsView(APIView):
    """Get blogs similar to a specific blog (content-based)."""
    permission_classes = [AllowAny]

    def get(self, request, blog_slug):
        n = int(request.query_params.get('limit', 6))

        try:
            blog = Blog.objects.only('id', 'category_id').get(slug=blog_slug)
        except Blog.DoesNotExist:
            return Response(
                {'error': 'Blog not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        engine = get_recommendation_engine()

        if engine.content_index:
            recommendations = engine.get_content_recommendations(blog.id, n)
            blog_ids = [r['blog_id'] for r in recommendations]
        else:
            blog_ids = []

        if blog_ids:
            blogs = Blog.objects.published_with_relations().filter(id__in=blog_ids)
            blog_dict = {b.id: b for b in blogs}
            ordered_blogs = [blog_dict[bid] for bid in blog_ids if bid in blog_dict]
        else:
            # Fallback to same category/tags
            ordered_blogs = Blog.objects.published_with_relations().filter(
                category=blog.category
            ).exclude(id=blog.id).order_by('-views_count')[:n]

        serializer = BlogListSerializer(
            ordered_blogs,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class RebuildIndexView(APIView):
    """Admin endpoint to rebuild recommendation indices."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )

        engine = get_recommendation_engine()
        engine.rebuild_indices()

        return Response({'message': 'Indices rebuilt successfully'})


class TrendingBlogsView(APIView):
    """Get trending blogs based on recent engagement."""
    permission_classes = [AllowAny]

    def get(self, request):
        n = int(request.query_params.get('limit', 10))
        days = int(request.query_params.get('days', 7))

        # Get blogs with recent engagement
        recent_date = timezone.now() - timedelta(days=days)

        trending = Blog.objects.published().select_related(
            'author', 'category'
        ).prefetch_related('tags', 'likes', 'comments', 'bookmarks').annotate(
            recent_likes=Count('likes', filter=models.Q(likes__created_at__gte=recent_date)),
            recent_comments=Count('comments', filter=models.Q(comments__created_at__gte=recent_date)),
            engagement_score=F('recent_likes') * 2 + F('recent_comments') * 3 + F('views_count') * 0.1
        ).order_by('-engagement_score')[:n]

        serializer = BlogListSerializer(
            trending,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
