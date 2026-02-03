import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSearch } from '@/components/products/ProductSearch';
import { useProducts, useCategories, useBrands } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import type { ProductFilters as FilterState, ProductCategory } from '@/types';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Partial<FilterState>>(() => ({
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
  }));

  const { data: productsData, isLoading } = useProducts(filters);
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();
  const { addToCart } = useCart();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.search) params.set('search', filters.search);
    if (filters.sortBy !== 'createdAt') params.set('sortBy', filters.sortBy!);
    if (filters.sortOrder !== 'desc') params.set('sortOrder', filters.sortOrder!);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query, page: 1 }));
  };

  const handleAddToCart = (productId: string) => {
    const product = productsData?.data?.products.find(p => p.id === productId);
    if (product) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
  };

  const products = productsData?.data?.products || [];
  const meta = productsData?.data?.meta;
  const categories: ProductCategory[] = (categoriesData?.data as ProductCategory[]) || [
    'mountain',
    'road',
    'hybrid',
    'electric',
    'kids',
  ];
  const brands = brandsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center justify-center space-x-2 bg-white border rounded-lg px-4 py-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>

        {/* Sidebar Filters */}
        <aside className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
            brands={brands}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-grow">
          {/* Search */}
          <div className="mb-6">
            <ProductSearch initialValue={filters.search} onSearch={handleSearch} />
          </div>

          {/* Results Count */}
          <div className="mb-4 text-gray-600">
            {meta && (
              <span>
                Showing {products.length} of {meta.total} products
              </span>
            )}
          </div>

          {/* Product Grid */}
          <ProductGrid products={products} onAddToCart={handleAddToCart} isLoading={isLoading} />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={filters.page === meta.totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
