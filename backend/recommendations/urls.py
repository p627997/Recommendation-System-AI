from django.urls import path
from .views import (
    RecommendationsView, SimilarBlogsView,
    RebuildIndexView, TrendingBlogsView
)

urlpatterns = [
    path('', RecommendationsView.as_view(), name='recommendations'),
    path('similar/<slug:blog_slug>/', SimilarBlogsView.as_view(), name='similar-blogs'),
    path('trending/', TrendingBlogsView.as_view(), name='trending'),
    path('rebuild/', RebuildIndexView.as_view(), name='rebuild-index'),
]
