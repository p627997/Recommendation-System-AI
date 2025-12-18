import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { blogAPI, categoryAPI } from '../services/api';
import BlogCard from '../components/BlogCard';
import RecommendationSection from '../components/RecommendationSection';
import { FiSearch, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const currentCategory = searchParams.get('category');
  const currentTag = searchParams.get('tag');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchParams.get('category')) params.category = searchParams.get('category');
      if (searchParams.get('tag')) params.tag = searchParams.get('tag');
      if (searchParams.get('search')) params.search = searchParams.get('search');

      const response = await blogAPI.getBlogs(params);
      setBlogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryClick = (slug) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
          Discover Amazing{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
            Blog Posts
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
          Get personalized recommendations powered by AI. Find blogs that match your interests.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto px-2 sm:px-0">
          <div className="relative">
            <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 sm:pl-12 pr-20 sm:pr-24 py-2.5 sm:py-3 rounded-full shadow-md text-sm sm:text-base"
            />
            <button
              type="submit"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 btn btn-primary rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-sm"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 px-1">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
            !currentCategory
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              currentCategory === category.slug
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Active Filters */}
      {(currentCategory || currentTag) && (
        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
          <span className="text-xs sm:text-sm text-gray-500">Filtering by:</span>
          {currentCategory && (
            <span className="bg-primary-100 text-primary-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
              Category: {currentCategory}
            </span>
          )}
          {currentTag && (
            <span className="bg-primary-100 text-primary-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
              Tag: {currentTag}
            </span>
          )}
          <button
            onClick={() => setSearchParams({})}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Personalized Recommendations for logged-in users */}
      {user && !currentCategory && !currentTag && !searchParams.get('search') && (
        <RecommendationSection title="Recommended for You" type="recommended" />
      )}

      {/* Blog Grid */}
      <section>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          {currentCategory || currentTag || searchParams.get('search')
            ? 'Results'
            : 'Latest Posts'}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin text-primary-500" size={32} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No blogs found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Section */}
      {!currentCategory && !currentTag && !searchParams.get('search') && (
        <RecommendationSection title="Trending Now" type="trending" />
      )}
    </div>
  );
}
