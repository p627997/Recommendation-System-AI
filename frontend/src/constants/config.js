/**
 * Application configuration constants
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 10000,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  BLOGS_PER_PAGE: 12,
  RECOMMENDATIONS_LIMIT: 6,
  SIMILAR_BLOGS_LIMIT: 4,
  TRENDING_LIMIT: 6,
  COMMENTS_PER_PAGE: 20,
};

export const INTERACTION_RATINGS = {
  VIEW: 1.0,
  COMMENT: 3.0,
  LIKE: 4.0,
  BOOKMARK: 5.0,
};

export const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};
