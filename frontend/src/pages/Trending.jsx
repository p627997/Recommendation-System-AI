import { useState, useEffect } from 'react';
import { recommendationAPI } from '../services/api';
import BlogCard from '../components/BlogCard';
import { FiTrendingUp, FiLoader } from 'react-icons/fi';

export default function Trending() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchTrending();
  }, [days]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const response = await recommendationAPI.getTrending({ limit: 12, days });
      setBlogs(response.data);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <FiTrendingUp className="text-orange-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Trending</h1>
            <p className="text-gray-600 text-sm sm:text-base">Most popular blogs right now</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                days === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="animate-spin text-primary-500" size={32} />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No trending blogs found for this period.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog, index) => (
            <div key={blog.id} className="relative">
              {index < 3 && (
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 shadow-lg">
                  {index + 1}
                </div>
              )}
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
