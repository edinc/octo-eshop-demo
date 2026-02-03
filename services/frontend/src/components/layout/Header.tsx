import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CartIcon } from '../cart/CartIcon';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">🚲 Octo E-Shop</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-600 hover:text-primary-600 transition-colors">
              Products
            </Link>
            <Link
              to="/products?category=mountain"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Mountain
            </Link>
            <Link
              to="/products?category=road"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Road
            </Link>
            <Link
              to="/products?category=electric"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Electric
            </Link>
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bikes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <CartIcon />

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">{user?.firstName}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    My Orders
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bikes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>
            <nav className="space-y-2">
              <Link
                to="/products"
                className="block py-2 text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>
              <Link
                to="/products?category=mountain"
                className="block py-2 text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Mountain Bikes
              </Link>
              <Link
                to="/products?category=road"
                className="block py-2 text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Road Bikes
              </Link>
              <Link
                to="/products?category=electric"
                className="block py-2 text-gray-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Electric Bikes
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
