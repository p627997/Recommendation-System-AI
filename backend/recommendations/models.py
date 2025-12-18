from django.db import models
from django.conf import settings


class UserInteraction(models.Model):
    """Track user interactions for recommendation engine."""
    INTERACTION_TYPES = [
        ('view', 'View'),
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('bookmark', 'Bookmark'),
        ('share', 'Share'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    blog = models.ForeignKey(
        'blog.Blog',
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    rating = models.FloatField(default=1.0)  # Implicit rating based on interaction
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.blog.title}"


class RecommendationCache(models.Model):
    """Cache recommendations to improve performance."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recommendation_cache'
    )
    recommended_blogs = models.JSONField(default=list)
    recommendation_type = models.CharField(max_length=50)  # 'collaborative', 'content', 'hybrid'
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Recommendations for {self.user.username}"
