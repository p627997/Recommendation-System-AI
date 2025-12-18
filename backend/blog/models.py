from django.db import models
from django.conf import settings
from django.utils.text import slugify


class BlogManager(models.Manager):
    """Custom manager for Blog model with optimized queries."""

    def with_relations(self):
        """Return queryset with all related objects prefetched."""
        return self.select_related(
            'author', 'category'
        ).prefetch_related(
            'tags', 'likes', 'comments', 'bookmarks'
        )

    def with_detail_relations(self):
        """Return queryset with relations needed for detail view."""
        return self.select_related(
            'author', 'category'
        ).prefetch_related(
            'tags', 'likes', 'comments__author', 'bookmarks'
        )

    def published(self):
        """Return only published blogs."""
        return self.filter(status='published')

    def published_with_relations(self):
        """Return published blogs with all relations."""
        return self.published().select_related(
            'author', 'category'
        ).prefetch_related(
            'tags', 'likes', 'comments', 'bookmarks'
        )


class Category(models.Model):
    """Blog categories for organization."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Tags for blog posts."""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Blog(models.Model):
    """Main blog post model."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    objects = BlogManager()

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blogs'
    )
    content = models.TextField()
    excerpt = models.TextField(max_length=500, blank=True)
    featured_image = models.ImageField(upload_to='blog_images/', blank=True, null=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blogs'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='blogs')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            # Ensure unique slug
            counter = 1
            original_slug = self.slug
            while Blog.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        if not self.excerpt and self.content:
            self.excerpt = self.content[:497] + '...' if len(self.content) > 500 else self.content
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Comment(models.Model):
    """Comments on blog posts."""
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField(max_length=1000)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.blog.title}"


class Like(models.Model):
    """Likes on blog posts for collaborative filtering."""
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blog', 'user')

    def __str__(self):
        return f"{self.user.username} likes {self.blog.title}"


class Bookmark(models.Model):
    """Bookmarks for saving blogs."""
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='bookmarks')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blog', 'user')

    def __str__(self):
        return f"{self.user.username} bookmarked {self.blog.title}"
