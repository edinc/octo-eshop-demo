import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">🚲 Octo E-Shop</h3>
            <p className="text-gray-400 text-sm">
              Premium bicycles for every rider. Quality, performance, and style since 2024.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link
                  to="/products?category=mountain"
                  className="hover:text-white transition-colors"
                >
                  Mountain Bikes
                </Link>
              </li>
              <li>
                <Link to="/products?category=road" className="hover:text-white transition-colors">
                  Road Bikes
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=electric"
                  className="hover:text-white transition-colors"
                >
                  Electric Bikes
                </Link>
              </li>
              <li>
                <Link to="/products?category=hybrid" className="hover:text-white transition-colors">
                  Hybrid Bikes
                </Link>
              </li>
              <li>
                <Link to="/products?category=kids" className="hover:text-white transition-colors">
                  Kids Bikes
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-white transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/warranty" className="hover:text-white transition-colors">
                  Warranty
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>123 Bike Street, Portland, OR 97201</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@octo-eshop.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Octo E-Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
