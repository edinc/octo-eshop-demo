import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import type { Product } from '@/types';
import { Button } from '../common/Button';
import { formatPrice } from '@/utils/formatters';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <Link to={`/products/${product.id}`} className="block relative">
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={product.images[0] || '/images/placeholder-bike.jpg'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/placeholder-bike.jpg';
            }}
          />
        </div>
        {product.featured && (
          <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded">
            Featured
          </span>
        )}
        {product.stock < 5 && product.stock > 0 && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Out of Stock
          </span>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</span>
            <Link to={`/products/${product.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1">
                {product.name}
              </h3>
            </Link>
          </div>
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
          <Button
            size="sm"
            onClick={() => onAddToCart(product.id)}
            disabled={product.stock === 0}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
