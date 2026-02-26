import { beforeEach, describe, expect, it, vi } from 'vitest';
import productService from './productService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
};

const mockedApi = api as unknown as ApiMock;

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: { success: true, data: [] } });
  });

  it('builds query params for getProducts', async () => {
    await productService.getProducts({
      category: 'mountain',
      brand: 'acme',
      minPrice: 100,
      maxPrice: 500,
      search: 'bike',
      sortBy: 'price',
      sortOrder: 'asc',
      page: 2,
      limit: 20,
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/products?category=mountain&brand=acme&minPrice=100&maxPrice=500&search=bike&sortBy=price&sortOrder=asc&page=2&limit=20'
    );
  });

  it('calls product endpoints', async () => {
    await productService.getProducts();
    await productService.getProduct('p1');
    await productService.getFeaturedProducts();
    await productService.getCategories();
    await productService.getBrands();
    await productService.searchProducts('road bike');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/products?');
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/products/p1');
    expect(mockedApi.get).toHaveBeenNthCalledWith(3, '/products/featured');
    expect(mockedApi.get).toHaveBeenNthCalledWith(4, '/products/categories');
    expect(mockedApi.get).toHaveBeenNthCalledWith(5, '/products/brands');
    expect(mockedApi.get).toHaveBeenNthCalledWith(6, '/products/search?q=road%20bike');
  });
});
