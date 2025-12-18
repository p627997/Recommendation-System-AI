import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiLogOut, FiBookmark, FiEdit } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-primary-600 bg-primary-50'
        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
    }`;

  const mobileNavLinkClass = (path) =>
    `block px-3 py-2 rounded-md transition-colors ${
      isActive(path)
        ? 'text-primary-600 bg-primary-50 font-medium'
        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
    }`;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl text-gray-900">BlogRec</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={navLinkClass('/')}>
              Home
            </Link>
            <Link to="/trending" className={navLinkClass('/trending')}>
              Trending
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-medium">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <span>{user.username}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border">
                    <Link
                      to="/my-blogs"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FiEdit className="mr-2" /> My Blogs
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FiBookmark className="mr-2" /> Bookmarks
                    </Link>
                    <Link
                      to="/create"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FiEdit className="mr-2" /> Write Blog
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-primary-600"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={mobileNavLinkClass('/')}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/trending"
              className={mobileNavLinkClass('/trending')}
              onClick={() => setIsOpen(false)}
            >
              Trending
            </Link>
            {user ? (
              <>
                <Link
                  to="/my-blogs"
                  className={mobileNavLinkClass('/my-blogs')}
                  onClick={() => setIsOpen(false)}
                >
                  My Blogs
                </Link>
                <Link
                  to="/bookmarks"
                  className={mobileNavLinkClass('/bookmarks')}
                  onClick={() => setIsOpen(false)}
                >
                  Bookmarks
                </Link>
                <Link
                  to="/create"
                  className={mobileNavLinkClass('/create')}
                  onClick={() => setIsOpen(false)}
                >
                  Write Blog
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={mobileNavLinkClass('/login')}
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={mobileNavLinkClass('/register')}
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
