import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiImage, FiLoader, FiX } from 'react-icons/fi';

export default function CreateBlog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    status: 'draft',
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
    fetchTags();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await categoryAPI.getTags();
      setTags(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTagToggle = (tagId) => {
    const currentTags = formData.tags;
    if (currentTags.includes(tagId)) {
      setFormData({ ...formData, tags: currentTags.filter((t) => t !== tagId) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tagId] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        category: formData.category || null,
      };
      const response = await blogAPI.createBlog(submitData);
      navigate(`/blog/${response.data.slug || response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Write a New Blog</h1>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input text-base sm:text-xl font-semibold"
            placeholder="Enter an engaging title..."
            required
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excerpt
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            className="input resize-none"
            placeholder="A brief summary of your blog (optional)..."
            rows={2}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="input resize-none min-h-[200px] sm:min-h-[300px]"
            placeholder="Write your blog content here..."
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  formData.tags.includes(tag.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === 'draft'}
                onChange={handleChange}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 text-sm sm:text-base">Save as Draft</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === 'published'}
                onChange={handleChange}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 text-sm sm:text-base">Publish Now</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                <span className="hidden sm:inline">{formData.status === 'published' ? 'Publishing...' : 'Saving...'}</span>
                <span className="sm:hidden">Saving...</span>
              </>
            ) : formData.status === 'published' ? (
              'Publish Blog'
            ) : (
              'Save Draft'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
