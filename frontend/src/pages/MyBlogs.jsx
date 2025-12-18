import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateShort } from '../utils/formatters';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiLoader, FiSend } from 'react-icons/fi';

export default function MyBlogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyBlogs();
  }, [user, navigate]);

  const fetchMyBlogs = async () => {
    try {
      const response = await blogAPI.getUserBlogs();
      setBlogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      await blogAPI.deleteBlog(slug);
      setBlogs(blogs.filter((blog) => blog.slug !== slug));
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handlePublish = async (slug) => {
    try {
      await blogAPI.updateBlog(slug, { status: 'published' });
      setBlogs(blogs.map((blog) =>
        blog.slug === slug ? { ...blog, status: 'published' } : blog
      ));
    } catch (error) {
      console.error('Error publishing blog:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <FiLoader className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Blogs</h1>
        <Link to="/create" className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <FiPlus /> Write New
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiEdit className="text-gray-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No blogs yet</h2>
          <p className="text-gray-600 mb-6">Start writing and share your thoughts with the world!</p>
          <Link to="/create" className="btn btn-primary">
            Write Your First Blog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <div key={blog.id} className="card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        blog.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {blog.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDateShort(blog.created_at)}
                    </span>
                  </div>
                  <Link
                    to={`/blog/${blog.slug}`}
                    className="text-base sm:text-lg font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 sm:truncate block"
                  >
                    {blog.title}
                  </Link>
                  <p className="text-sm text-gray-500 line-clamp-2 sm:truncate">{blog.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiEye size={14} />
                      {blog.views_count} views
                    </span>
                    <span>{blog.likes_count} likes</span>
                    <span>{blog.comments_count} comments</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 sm:ml-4">
                  {blog.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(blog.slug)}
                      className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-0"
                      title="Publish"
                    >
                      <FiSend size={18} />
                      <span className="text-xs sm:hidden">Publish</span>
                    </button>
                  )}
                  <Link
                    to={`/blog/${blog.slug}`}
                    className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-0"
                    title="View"
                  >
                    <FiEye size={18} />
                    <span className="text-xs sm:hidden">View</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(blog.slug)}
                    className="flex-1 sm:flex-none p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-0"
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                    <span className="text-xs sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
