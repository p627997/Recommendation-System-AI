from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Category, Tag, Blog, Comment, Like, Bookmark
from .serializers import (
    CategorySerializer, TagSerializer, BlogListSerializer,
    BlogDetailSerializer, BlogCreateUpdateSerializer,
    CommentSerializer, BookmarkSerializer
)
from .services import track_user_interaction
from .permissions import IsAuthorOrReadOnly


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class TagListView(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None


class BlogListView(generics.ListCreateAPIView):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'tags__name', 'category__name']
    ordering_fields = ['created_at', 'views_count', 'published_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Blog.objects.published_with_relations()

        category = self.request.query_params.get('category')
        tag = self.request.query_params.get('tag')
        author = self.request.query_params.get('author')

        if category:
            queryset = queryset.filter(category__slug=category)
        if tag:
            queryset = queryset.filter(tags__slug=tag)
        if author:
            queryset = queryset.filter(author__username=author)

        return queryset.distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BlogCreateUpdateSerializer
        return BlogListSerializer

    def perform_create(self, serializer):
        blog = serializer.save(author=self.request.user)
        if blog.status == 'published':
            blog.published_at = timezone.now()
            blog.save()


class BlogDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Blog.objects.with_detail_relations()
    lookup_field = 'slug'
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BlogCreateUpdateSerializer
        return BlogDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        Blog.objects.filter(pk=instance.pk).update(views_count=instance.views_count + 1)

        # Track user interaction
        track_user_interaction(request.user, instance, 'view')

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        blog = serializer.save()
        if blog.status == 'published' and not blog.published_at:
            blog.published_at = timezone.now()
            blog.save()


class UserBlogsView(generics.ListAPIView):
    serializer_class = BlogListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Blog.objects.filter(author=self.request.user)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        blog_slug = self.kwargs.get('blog_slug')
        return Comment.objects.filter(blog__slug=blog_slug, parent=None)

    def perform_create(self, serializer):
        blog_slug = self.kwargs.get('blog_slug')
        blog = get_object_or_404(Blog, slug=blog_slug)
        serializer.save(author=self.request.user, blog=blog)

        # Track interaction
        track_user_interaction(self.request.user, blog, 'comment')


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(author=self.request.user)


class LikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, blog_slug):
        blog = get_object_or_404(Blog, slug=blog_slug)
        like, created = Like.objects.get_or_create(blog=blog, user=request.user)

        if created:
            track_user_interaction(request.user, blog, 'like')
            return Response({'liked': True, 'likes_count': blog.likes.count()})
        else:
            like.delete()
            return Response({'liked': False, 'likes_count': blog.likes.count()})


class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, blog_slug):
        blog = get_object_or_404(Blog, slug=blog_slug)
        bookmark, created = Bookmark.objects.get_or_create(blog=blog, user=request.user)

        if created:
            track_user_interaction(request.user, blog, 'bookmark')
            return Response({'bookmarked': True})
        else:
            bookmark.delete()
            return Response({'bookmarked': False})


class UserBookmarksView(generics.ListAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)
