import api from './api';
import type { ApiResponse, Product, PaginationMeta, ProductFilters } from '@/types';

interface ProductListResponse {
  products: Product[];
  meta: PaginationMeta;
}

export const productService = {
  async getProducts(
    filters: Partial<ProductFilters> = {}
  ): Promise<ApiResponse<ProductListResponse>> {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<ApiResponse<ProductListResponse>>(
      `/products?${params.toString()}`
    );
    return response.data;
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    const response = await api.get<ApiResponse<Product[]>>('/products/featured');
    return response.data;
  },

  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    return response.data;
  },

  async getBrands(): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>('/products/brands');
    return response.data;
  },

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    const response = await api.get<ApiResponse<Product[]>>(
      `/products/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};

export default productService;
