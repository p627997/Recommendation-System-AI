from rest_framework import serializers
from .models import Category, Tag, Blog, Comment, Like, Bookmark
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']
        read_only_fields = ['slug']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'blog', 'author', 'content', 'parent', 'replies', 'created_at', 'updated_at']
        read_only_fields = ['blog', 'author', 'created_at', 'updated_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []


class BlogListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Blog
        fields = [
            'id', 'title', 'slug', 'author', 'excerpt', 'featured_image',
            'category', 'tags', 'status', 'views_count', 'likes_count',
            'comments_count', 'is_liked', 'is_bookmarked', 'created_at', 'published_at'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False


class BlogDetailSerializer(BlogListSerializer):
    comments = serializers.SerializerMethodField()

    class Meta(BlogListSerializer.Meta):
        fields = BlogListSerializer.Meta.fields + ['content', 'comments']

    def get_comments(self, obj):
        # Only get top-level comments (no parent)
        comments = obj.comments.filter(parent=None)
        return CommentSerializer(comments, many=True).data


class BlogCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False
    )

    class Meta:
        model = Blog
        fields = ['id', 'slug', 'title', 'content', 'excerpt', 'featured_image', 'category', 'tags', 'status']
        read_only_fields = ['id', 'slug']

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        blog = Blog.objects.create(**validated_data)
        blog.tags.set(tags)
        return blog

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'blog', 'user', 'created_at']
        read_only_fields = ['user', 'created_at']


class BookmarkSerializer(serializers.ModelSerializer):
    blog = BlogListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'blog', 'created_at']
        read_only_fields = ['created_at']
