import { useState, useEffect, useCallback } from 'react';
import { blogAPI, recommendationAPI } from '../services/api';
import { PAGINATION } from '../constants/config';

/**
 * Hook for fetching blog list with filters
 */
export function useBlogs(filters = {}) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await blogAPI.getBlogs(filters);
      setBlogs(response.data.results || response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return { blogs, loading, error, refetch: fetchBlogs };
}

/**
 * Hook for fetching a single blog by slug
 */
export function useBlog(slug) {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlog = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setBlog(null);
    setError(null);
    try {
      const response = await blogAPI.getBlog(slug);
      setBlog(response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching blog:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  return { blog, setBlog, loading, error, refetch: fetchBlog };
}

/**
 * Hook for fetching recommendations
 */
export function useRecommendations(type, blogSlug = null, limit = PAGINATION.RECOMMENDATIONS_LIMIT) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (type) {
        case 'similar':
          response = await recommendationAPI.getSimilarBlogs(blogSlug, { limit });
          break;
        case 'trending':
          response = await recommendationAPI.getTrending({ limit });
          break;
        default:
          response = await recommendationAPI.getRecommendations({
            blog: blogSlug,
            limit,
          });
      }
      setBlogs(response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [type, blogSlug, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { blogs, loading, error, refetch: fetchRecommendations };
}

/**
 * Hook for blog interactions (like, bookmark)
 */
export function useBlogInteractions(slug, initialState = {}) {
  const [isLiked, setIsLiked] = useState(initialState.isLiked || false);
  const [likesCount, setLikesCount] = useState(initialState.likesCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(initialState.isBookmarked || false);

  const updateState = useCallback((data) => {
    if (data.is_liked !== undefined) setIsLiked(data.is_liked);
    if (data.likes_count !== undefined) setLikesCount(data.likes_count);
    if (data.is_bookmarked !== undefined) setIsBookmarked(data.is_bookmarked);
  }, []);

  const toggleLike = useCallback(async () => {
    try {
      const response = await blogAPI.toggleLike(slug);
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likes_count);
      return response.data;
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    }
  }, [slug]);

  const toggleBookmark = useCallback(async () => {
    try {
      const response = await blogAPI.toggleBookmark(slug);
      setIsBookmarked(response.data.bookmarked);
      return response.data;
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      throw err;
    }
  }, [slug]);

  return {
    isLiked,
    likesCount,
    isBookmarked,
    toggleLike,
    toggleBookmark,
    updateState,
  };
}
