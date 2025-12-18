import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiBookmark, FiEye } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useBlogInteractions } from '../hooks/useBlogs';
import { formatDateShort } from '../utils/formatters';

export default function BlogCard({ blog, onUpdate }) {
  const { user } = useAuth();
  const {
    isLiked,
    likesCount,
    isBookmarked,
    toggleLike,
    toggleBookmark,
  } = useBlogInteractions(blog.slug, {
    isLiked: blog.is_liked,
    likesCount: blog.likes_count,
    isBookmarked: blog.is_bookmarked,
  });

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await toggleLike();
      onUpdate?.();
    } catch (error) {
      // Error logged in hook
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      await toggleBookmark();
      onUpdate?.();
    } catch (error) {
      // Error logged in hook
    }
  };

  return (
    <article className="card overflow-hidden group">
      {blog.featured_image && (
        <Link to={`/blog/${blog.slug}`}>
          <div className="aspect-video overflow-hidden">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
          {blog.category && (
            <Link
              to={`/?category=${blog.category.slug}`}
              className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full hover:bg-primary-100"
            >
              {blog.category.name}
            </Link>
          )}
          <span className="text-xs text-gray-400">
            {formatDateShort(blog.published_at || blog.created_at)}
          </span>
        </div>

        <Link to={`/blog/${blog.slug}`}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {blog.title}
          </h2>
        </Link>

        <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-2">
          {blog.excerpt}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-medium">
                {blog.author?.username?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-600">{blog.author?.username}</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-3 text-gray-400">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                isLiked ? 'text-red-500' : ''
              }`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} size={14} />
              <span className="text-xs">{likesCount}</span>
            </button>

            <Link to={`/blog/${blog.slug}#comments`} className="flex items-center gap-1 hover:text-primary-500">
              <FiMessageCircle size={14} />
              <span className="text-xs">{blog.comments_count}</span>
            </Link>

            <button
              onClick={handleBookmark}
              className={`hover:text-primary-500 transition-colors ${
                isBookmarked ? 'text-primary-500' : ''
              }`}
            >
              <FiBookmark className={isBookmarked ? 'fill-current' : ''} size={14} />
            </button>

            <span className="flex items-center gap-1">
              <FiEye size={14} />
              <span className="text-xs">{blog.views_count}</span>
            </span>
          </div>
        </div>

        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {blog.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                to={`/?tag=${tag.slug}`}
                className="text-xs text-gray-500 hover:text-primary-600"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
