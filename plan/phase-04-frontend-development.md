# Phase 4: Frontend Development

## Overview
Build the React frontend application with all customer-facing pages: Homepage, Products catalog, Product detail, Shopping cart, Checkout, and User authentication/profile pages.

## Prerequisites
- Phase 2 & 3 completed (backend APIs available)
- Design mockups/wireframes (optional)

---

## Tasks

### 4.1 React Project Setup

**Objective:** Initialize React project with Vite, configure routing and state management.

#### Directory Structure:
```
services/frontend/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Layout.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   └── ProductSearch.tsx
│   │   ├── cart/
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CartIcon.tsx
│   │   └── checkout/
│   │       ├── AddressForm.tsx
│   │       ├── PaymentForm.tsx
│   │       └── OrderSummary.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── useOrders.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── cartService.ts
│   │   └── orderService.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── cartSlice.ts
│   │   └── uiSlice.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── Dockerfile
└── nginx.conf
```

#### File: `services/frontend/package.json`
```json
{
  "name": "@octo-eshop/frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@octo-eshop/types": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@reduxjs/toolkit": "^2.0.1",
    "react-redux": "^9.0.4",
    "axios": "^1.6.5",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    "lucide-react": "^0.303.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.16",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "jsdom": "^23.2.0"
  }
}
```

#### File: `services/frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

#### File: `services/frontend/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          500: '#64748b',
          600: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

---

### 4.2 Component Library

**Objective:** Create reusable UI components.

#### File: `services/frontend/src/components/common/Button.tsx`
```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### File: `services/frontend/src/components/common/Input.tsx`
```tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 hover:border-gray-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

#### File: `services/frontend/src/components/products/ProductCard.tsx`
```tsx
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '@octo-eshop/types';
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
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {product.brand}
            </span>
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

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
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
```

#### File: `services/frontend/src/components/products/ProductFilters.tsx`
```tsx
import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { ProductCategory } from '@octo-eshop/types';

interface FilterState {
  category?: ProductCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  brands: string[];
  categories: ProductCategory[];
}

export function ProductFilters({
  filters,
  onFilterChange,
  brands,
  categories,
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || '',
    max: filters.maxPrice || '',
  });

  const handleCategoryChange = (category: ProductCategory | undefined) => {
    onFilterChange({ ...filters, category });
  };

  const handleBrandChange = (brand: string | undefined) => {
    onFilterChange({ ...filters, brand });
  };

  const handlePriceApply = () => {
    onFilterChange({
      ...filters,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
    onFilterChange({ ...filters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    onFilterChange({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters =
    filters.category || filters.brand || filters.minPrice || filters.maxPrice;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
          <option value="name-desc">Name: Z-A</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat}
                onChange={() => handleCategoryChange(cat)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">{cat}</span>
            </label>
          ))}
          {filters.category && (
            <button
              onClick={() => handleCategoryChange(undefined)}
              className="text-sm text-primary-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand
        </label>
        <select
          value={filters.brand || ''}
          onChange={(e) => handleBrandChange(e.target.value || undefined)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-2 w-full bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
        >
          Apply
        </button>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
          Clear All Filters
        </button>
      )}
    </div>
  );
}
```

---

### 4.3 Homepage Implementation

**Objective:** Create an engaging homepage with hero section, featured products, and shop description.

#### File: `services/frontend/src/pages/HomePage.tsx`
```tsx
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Award, Headphones } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { productService } from '@/services/productService';
import { useCart } from '@/hooks/useCart';

export function HomePage() {
  const { addToCart } = useCart();

  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getProducts({ featured: true, limit: 4 }),
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src="/images/hero-bike.jpg"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ride Your Dream
              <span className="text-primary-400"> Bicycle</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8">
              Discover our premium collection of bicycles for every adventure.
              From mountain trails to city streets, find your perfect ride.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Shop Now
                </Button>
              </Link>
              <Link to="/products?category=electric">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                  Explore E-Bikes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <Truck className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Free Shipping</h3>
              <p className="text-sm text-gray-500">On orders over $500</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">2-Year Warranty</h3>
              <p className="text-sm text-gray-500">Full coverage</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Quality Guaranteed</h3>
              <p className="text-sm text-gray-500">Top brands only</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                <Headphones className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Expert Support</h3>
              <p className="text-sm text-gray-500">7 days a week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Bikes</h2>
              <p className="text-gray-600 mt-1">Hand-picked selection of our best sellers</p>
            </div>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.data.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Mountain', slug: 'mountain', image: '/images/cat-mountain.jpg' },
              { name: 'Road', slug: 'road', image: '/images/cat-road.jpg' },
              { name: 'Hybrid', slug: 'hybrid', image: '/images/cat-hybrid.jpg' },
              { name: 'Electric', slug: 'electric', image: '/images/cat-electric.jpg' },
              { name: 'Kids', slug: 'kids', image: '/images/cat-kids.jpg' },
            ].map((category) => (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className="group relative aspect-square rounded-xl overflow-hidden"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Your Trusted Bicycle Partner Since 2024
              </h2>
              <p className="text-primary-100 mb-4">
                At Octo Bikes, we're passionate about cycling. Whether you're a seasoned
                professional or just starting your cycling journey, we have the perfect
                bike waiting for you.
              </p>
              <p className="text-primary-100 mb-6">
                Our expert team carefully selects each bicycle from the world's leading
                manufacturers, ensuring you get nothing but the best quality and value.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  Over 500+ premium bicycles in stock
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  Expert assembly and setup included
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  Lifetime maintenance support
                </li>
              </ul>
            </div>
            <div className="relative">
              <img
                src="/images/about-shop.jpg"
                alt="Our bike shop"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-gray-400 mb-6">
            Subscribe to our newsletter for exclusive deals, new arrivals, and cycling tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
```

---

### 4.4 Products Page

#### File: `services/frontend/src/pages/ProductsPage.tsx`
```tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { productService } from '@/services/productService';
import { useCart } from '@/hooks/useCart';
import { ProductCategory } from '@octo-eshop/types';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  const filters = {
    category: searchParams.get('category') as ProductCategory | undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const brands = ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott', 'Canyon'];

  const handleFilterChange = (newFilters: any) => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });
    params.delete('page'); // Reset page on filter change
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ search: searchQuery || undefined });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bicycles</h1>
        <p className="text-gray-600 mt-1">
          {data?.meta?.total || 0} products available
        </p>
      </div>

      {/* Search & Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bicycles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          className="sm:hidden"
        >
          Filters
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`${
            showFilters ? 'block' : 'hidden'
          } sm:block w-full sm:w-64 flex-shrink-0`}
        >
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            brands={brands}
            categories={categories?.data || ['mountain', 'road', 'hybrid', 'electric', 'kids']}
          />
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading products. Please try again.</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.data.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    disabled={filters.page <= 1}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {filters.page} of {data.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={filters.page >= data.meta.totalPages}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

### 4.5 Cart & Checkout Pages

#### File: `services/frontend/src/pages/CartPage.tsx`
```tsx
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/formatters';

export function CartPage() {
  const { cart, updateQuantity, removeItem, isLoading, cartTotal } = useCart();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">
          Looks like you haven't added any bikes to your cart yet.
        </p>
        <Link to="/products">
          <Button>Browse Bicycles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 bg-white p-4 rounded-lg shadow-sm"
            >
              <img
                src={`/images/products/${item.productId}.jpg`}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-lg bg-gray-100"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-lg font-bold text-primary-600 mt-1">
                  {formatPrice(item.price)}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {cartTotal >= 500 ? 'Free' : formatPrice(29.99)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatPrice(cartTotal * 0.08)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                {formatPrice(
                  cartTotal + (cartTotal >= 500 ? 0 : 29.99) + cartTotal * 0.08
                )}
              </span>
            </div>
          </div>

          <Link to="/checkout" className="block mt-6">
            <Button className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>

          <Link
            to="/products"
            className="block text-center mt-4 text-primary-600 hover:underline text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 4.6 API Services

#### File: `services/frontend/src/services/api.ts`
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/users/refresh-token', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### File: `services/frontend/src/services/productService.ts`
```typescript
import api from './api';
import { Product, ApiResponse, PaginationMeta, ProductCategory } from '@octo-eshop/types';

interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: ProductCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProductsResponse {
  data: Product[];
  meta: PaginationMeta;
}

export const productService = {
  async getProducts(params: GetProductsParams): Promise<ProductsResponse> {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return {
      data: response.data.data!,
      meta: response.data.meta!,
    };
  },

  async getProduct(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  async getCategories(): Promise<{ data: ProductCategory[] }> {
    const response = await api.get<ApiResponse<ProductCategory[]>>('/products/categories');
    return { data: response.data.data! };
  },

  async searchProducts(query: string, page = 1, limit = 20): Promise<ProductsResponse> {
    const response = await api.get<ApiResponse<Product[]>>('/products/search', {
      params: { q: query, page, limit },
    });
    return {
      data: response.data.data!,
      meta: response.data.meta!,
    };
  },
};
```

---

## Testing Strategy

#### File: `services/frontend/src/components/products/ProductCard.test.tsx`
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: '1',
  name: 'Trek Marlin 7',
  description: 'A versatile hardtail mountain bike',
  price: 1099.99,
  category: 'mountain' as const,
  brand: 'Trek',
  images: ['/images/trek-marlin.jpg'],
  stock: 10,
  featured: true,
  specifications: {
    frameSize: 'M',
    wheelSize: '29"',
    weight: 13.5,
    material: 'Aluminum',
    gears: 18,
    color: 'Black',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Trek Marlin 7')).toBeInTheDocument();
    expect(screen.getByText('Trek')).toBeInTheDocument();
    expect(screen.getByText('$1,099.99')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('calls onAddToCart when Add button is clicked', () => {
    const handleAddToCart = vi.fn();
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} onAddToCart={handleAddToCart} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Add'));
    expect(handleAddToCart).toHaveBeenCalledWith('1');
  });

  it('disables Add button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(
      <BrowserRouter>
        <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Add')).toBeDisabled();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
```

---

## Deliverables Checklist

- [ ] Vite + React project setup
- [ ] Tailwind CSS configuration
- [ ] Component library (Button, Input, Card, Modal, Spinner)
- [ ] Layout components (Header, Footer, Navbar)
- [ ] Homepage with hero, features, featured products, categories
- [ ] Products page with grid, filters, search, pagination
- [ ] Product detail page with images, specs, add to cart
- [ ] Cart page with item management
- [ ] Checkout page with address and payment forms
- [ ] Login and Register pages
- [ ] Profile page with order history
- [ ] Order detail page
- [ ] API service layer with Axios
- [ ] React Query for data fetching
- [ ] Redux for global state (auth, cart, UI)
- [ ] Protected routes for authenticated users
- [ ] Responsive design (mobile-first)
- [ ] Unit tests for components (>80% coverage)
- [ ] E2E tests for critical flows

---

## Dependencies

**Depends on:**
- Phase 2 & 3: Backend APIs

**Required by:**
- Phase 5: Containerization (Dockerfile)
- Phase 6: Kubernetes configuration
