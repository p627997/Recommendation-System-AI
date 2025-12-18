from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView, TagListView,
    BlogListView, BlogDetailView, UserBlogsView,
    CommentListCreateView, CommentDetailView,
    LikeToggleView, BookmarkToggleView, UserBookmarksView
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category-detail'),

    # Tags
    path('tags/', TagListView.as_view(), name='tag-list'),

    # Blogs
    path('blogs/', BlogListView.as_view(), name='blog-list'),
    path('blogs/my/', UserBlogsView.as_view(), name='user-blogs'),
    path('blogs/<slug:slug>/', BlogDetailView.as_view(), name='blog-detail'),

    # Comments
    path('blogs/<slug:blog_slug>/comments/', CommentListCreateView.as_view(), name='comment-list'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),

    # Likes & Bookmarks
    path('blogs/<slug:blog_slug>/like/', LikeToggleView.as_view(), name='like-toggle'),
    path('blogs/<slug:blog_slug>/bookmark/', BookmarkToggleView.as_view(), name='bookmark-toggle'),
    path('bookmarks/', UserBookmarksView.as_view(), name='user-bookmarks'),
]
