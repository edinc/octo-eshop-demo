import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBrands,
  useCategories,
  useFeaturedProducts,
  useProduct,
  useProducts,
} from './useProducts';
import productService from '@/services/productService';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: null })),
}));

vi.mock('@/services/productService', () => ({
  default: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    getFeaturedProducts: vi.fn(),
    getCategories: vi.fn(),
    getBrands: vi.fn(),
  },
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedProductService = productService as unknown as {
  getProducts: ReturnType<typeof vi.fn>;
  getProduct: ReturnType<typeof vi.fn>;
  getFeaturedProducts: ReturnType<typeof vi.fn>;
  getCategories: ReturnType<typeof vi.fn>;
  getBrands: ReturnType<typeof vi.fn>;
};

describe('useProducts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures products query with filters', async () => {
    const filters = { category: 'road', page: 2 };
    useProducts(filters);

    const options = mockedUseQuery.mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
    };
    expect(options.queryKey).toEqual(['products', filters]);

    await options.queryFn();
    expect(mockedProductService.getProducts).toHaveBeenCalledWith(filters);
  });

  it('configures single product query and enabled flag', async () => {
    useProduct('p1');
    let options = mockedUseQuery.mock.calls[0][0] as {
      enabled?: boolean;
      queryFn?: () => Promise<unknown>;
    };
    expect(options.enabled).toBe(true);
    await options.queryFn?.();
    expect(mockedProductService.getProduct).toHaveBeenCalledWith('p1');

    mockedUseQuery.mockClear();
    useProduct('');
    options = mockedUseQuery.mock.calls[0][0] as {
      enabled?: boolean;
      queryFn?: () => Promise<unknown>;
    };
    expect(options.enabled).toBe(false);
  });

  it('configures featured/categories/brands queries', async () => {
    useFeaturedProducts();
    useCategories();
    useBrands();

    const featuredOptions = mockedUseQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> };
    const categoriesOptions = mockedUseQuery.mock.calls[1][0] as {
      queryFn: () => Promise<unknown>;
    };
    const brandsOptions = mockedUseQuery.mock.calls[2][0] as { queryFn: () => Promise<unknown> };

    await featuredOptions.queryFn();
    await categoriesOptions.queryFn();
    await brandsOptions.queryFn();

    expect(mockedProductService.getFeaturedProducts).toHaveBeenCalledOnce();
    expect(mockedProductService.getCategories).toHaveBeenCalledOnce();
    expect(mockedProductService.getBrands).toHaveBeenCalledOnce();
  });
});
