import { useQuery } from '@tanstack/react-query';
import productService from '@/services/productService';
import type { ProductFilters } from '@/types';

export function useProducts(filters: Partial<ProductFilters> = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeaturedProducts(),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => productService.getBrands(),
  });
}
