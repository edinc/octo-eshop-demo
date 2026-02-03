import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProductFilters as FilterState, ProductCategory } from '@/types';

interface ProductFiltersProps {
  filters: Partial<FilterState>;
  onFilterChange: (filters: Partial<FilterState>) => void;
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
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || '',
  });

  const handleCategoryChange = (category: string | undefined) => {
    onFilterChange({ ...filters, category, page: 1 });
  };

  const handleBrandChange = (brand: string | undefined) => {
    onFilterChange({ ...filters, brand, page: 1 });
  };

  const handlePriceApply = () => {
    onFilterChange({
      ...filters,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
      page: 1,
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
      page: 1,
      limit: filters.limit || 12,
    });
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters =
    filters.category || filters.brand || filters.minPrice || filters.maxPrice;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
        <select
          value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
          onChange={e => handleSortChange(e.target.value)}
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <div className="space-y-2">
          {categories.map(cat => (
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
              Clear category
            </button>
          )}
        </div>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
        <select
          value={filters.brand || ''}
          onChange={e => handleBrandChange(e.target.value || undefined)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Brands</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-2 text-sm text-primary-600 hover:underline"
        >
          Apply price filter
        </button>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );
}
