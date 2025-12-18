import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarkAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BlogCard from '../components/BlogCard';
import { FiBookmark, FiLoader } from 'react-icons/fi';

export default function Bookmarks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookmarks();
  }, [user, navigate]);

  const fetchBookmarks = async () => {
    try {
      const response = await bookmarkAPI.getBookmarks();
      setBookmarks(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">My Bookmarks</h1>

      {bookmarks.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookmark className="text-gray-400" size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks yet</h2>
          <p className="text-gray-600">
            Save interesting blogs to read later by clicking the bookmark icon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <BlogCard
              key={bookmark.id}
              blog={bookmark.blog}
              onUpdate={fetchBookmarks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
