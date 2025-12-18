import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { commentAPI } from '../services/api';
import RecommendationSection from '../components/RecommendationSection';
import { useAuth } from '../context/AuthContext';
import { useBlog, useBlogInteractions } from '../hooks/useBlogs';
import { formatDate } from '../utils/formatters';
import {
  FiHeart, FiBookmark, FiMessageCircle, FiEye,
  FiCalendar, FiSend, FiLoader, FiArrowLeft
} from 'react-icons/fi';

export default function BlogDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { blog, loading } = useBlog(slug);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    isLiked,
    likesCount,
    isBookmarked,
    toggleLike,
    toggleBookmark,
    updateState,
  } = useBlogInteractions(slug);

  useEffect(() => {
    if (blog) {
      updateState({
        is_liked: blog.is_liked,
        likes_count: blog.likes_count,
        is_bookmarked: blog.is_bookmarked,
      });
      setComments(blog.comments || []);
    }
  }, [blog, updateState]);

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getComments(slug);
      setComments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await toggleLike();
    } catch (error) {
      // Error logged in hook
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      await toggleBookmark();
    } catch (error) {
      // Error logged in hook
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      await commentAPI.createComment(slug, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog not found</h1>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6">
        <FiArrowLeft /> Back to blogs
      </Link>

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          {blog.category && (
            <Link
              to={`/?category=${blog.category.slug}`}
              className="inline-block text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-4 hover:bg-primary-100"
            >
              {blog.category.name}
            </Link>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm sm:text-base">
                  {blog.author?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">{blog.author?.username}</p>
                <p className="text-xs sm:text-sm text-gray-500">Author</p>
              </div>
            </div>

            <span className="text-gray-300 hidden sm:inline">|</span>

            <div className="flex items-center gap-1">
              <FiCalendar size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{formatDate(blog.published_at || blog.created_at)}</span>
            </div>

            <div className="flex items-center gap-1">
              <FiEye size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{blog.views_count} views</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border transition-all text-sm sm:text-base ${
                isLiked
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiHeart className={isLiked ? 'fill-current' : ''} size={16} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              disabled={!user}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border transition-all text-sm sm:text-base ${
                isBookmarked
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:text-primary-500'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiBookmark className={isBookmarked ? 'fill-current' : ''} size={16} />
              <span className="hidden xs:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        {blog.featured_image && (
          <div className="aspect-video rounded-2xl overflow-hidden mb-8">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {blog.content}
          </div>
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {blog.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/?tag=${tag.slug}`}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <section id="comments" className="border-t pt-6 sm:pt-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <FiMessageCircle />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-6 sm:mb-8">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-medium text-sm sm:text-base">
                    {user.username[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="input min-h-[80px] sm:min-h-[100px] resize-none text-sm sm:text-base"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="btn btn-primary flex items-center gap-2 text-sm sm:text-base"
                    >
                      {submitting ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiSend size={16} />
                      )}
                      <span className="hidden sm:inline">Post Comment</span>
                      <span className="sm:hidden">Post</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-center">
              <p className="text-gray-600 mb-4">Please login to leave a comment</p>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 sm:space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-medium text-sm sm:text-base">
                    {comment.author?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        {comment.author?.username}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base break-words">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </section>
      </article>

      {/* Similar Blogs - Only render after blog is loaded */}
      {blog && (
        <div className="max-w-7xl mx-auto mt-12">
          <RecommendationSection
            blogSlug={slug}
            title="Similar Posts You Might Like"
            type="similar"
          />
        </div>
      )}
    </div>
  );
}
