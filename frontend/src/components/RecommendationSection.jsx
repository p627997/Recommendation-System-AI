import { useRecommendations } from '../hooks/useBlogs';
import BlogCard from './BlogCard';
import { FiTrendingUp, FiStar, FiLoader } from 'react-icons/fi';
import { PAGINATION } from '../constants/config';

const ICONS = {
  trending: <FiTrendingUp className="text-orange-500" />,
  similar: <FiStar className="text-yellow-500" />,
  recommended: <FiStar className="text-primary-500" />,
};

export default function RecommendationSection({
  blogSlug,
  title,
  type = 'recommended',
  limit
}) {
  const finalLimit = limit || (type === 'similar'
    ? PAGINATION.SIMILAR_BLOGS_LIMIT
    : PAGINATION.RECOMMENDATIONS_LIMIT);

  const { blogs, loading } = useRecommendations(type, blogSlug, finalLimit);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <FiLoader className="animate-spin text-primary-500" size={24} />
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        {ICONS[type] || ICONS.recommended}
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </section>
  );
}
