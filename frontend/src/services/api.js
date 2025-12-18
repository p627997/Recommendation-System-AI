import axios from 'axios';
import { API_CONFIG } from '../constants/config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
};

// Blog APIs
export const blogAPI = {
  getBlogs: (params) => api.get('/blogs/', { params }),
  getBlog: (slug) => api.get(`/blogs/${slug}/`),
  createBlog: (data) => api.post('/blogs/', data),
  updateBlog: (slug, data) => api.patch(`/blogs/${slug}/`, data),
  deleteBlog: (slug) => api.delete(`/blogs/${slug}/`),
  getUserBlogs: () => api.get('/blogs/my/'),
  toggleLike: (slug) => api.post(`/blogs/${slug}/like/`),
  toggleBookmark: (slug) => api.post(`/blogs/${slug}/bookmark/`),
};

// Comment APIs
export const commentAPI = {
  getComments: (blogSlug) => api.get(`/blogs/${blogSlug}/comments/`),
  createComment: (blogSlug, data) => api.post(`/blogs/${blogSlug}/comments/`, data),
  deleteComment: (id) => api.delete(`/comments/${id}/`),
};

// Category & Tag APIs
export const categoryAPI = {
  getCategories: () => api.get('/categories/'),
  getTags: () => api.get('/tags/'),
};

// Recommendation APIs
export const recommendationAPI = {
  getRecommendations: (params) => api.get('/recommendations/', { params }),
  getSimilarBlogs: (slug, params) => api.get(`/recommendations/similar/${slug}/`, { params }),
  getTrending: (params) => api.get('/recommendations/trending/', { params }),
};

// Bookmark APIs
export const bookmarkAPI = {
  getBookmarks: () => api.get('/bookmarks/'),
};

export default api;
