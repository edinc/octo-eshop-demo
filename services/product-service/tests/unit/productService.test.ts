import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../../src/services/productService';

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: {
    list: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    getCategories: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockProductRepository = {
      list: vi.fn(),
      findById: vi.fn(),
      search: vi.fn(),
      getCategories: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productService = new ProductService(mockProductRepository as any);
  });

  describe('list', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        { id: '1', name: 'Trek Marlin 7', price: 1099.99 },
        { id: '2', name: 'Specialized Allez', price: 1299.99 },
      ];
      mockProductRepository.list.mockResolvedValue({
        products: mockProducts,
        total: 2,
      });

      const result = await productService.list({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockProductRepository.list).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      mockProductRepository.list.mockResolvedValue({
        products: [],
        total: 0,
      });

      await productService.list({
        page: 1,
        limit: 20,
        category: 'mountain',
        sortBy: 'price',
        sortOrder: 'asc',
      });

      expect(mockProductRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'mountain' })
      );
    });
  });

  describe('getById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: '1',
        name: 'Trek Marlin 7',
        price: 1099.99,
        category: 'mountain',
      };
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      const result = await productService.getById('1');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(productService.getById('999')).rejects.toThrow('Product not found');
    });
  });

  describe('search', () => {
    it('should search products by term', async () => {
      const mockProducts = [{ id: '1', name: 'Trek Marlin 7' }];
      mockProductRepository.search.mockResolvedValue({
        products: mockProducts,
        total: 1,
      });

      const result = await productService.search('Trek', 1, 20);

      expect(result.products).toHaveLength(1);
      expect(mockProductRepository.search).toHaveBeenCalledWith('Trek', 1, 20);
    });
  });

  describe('getCategories', () => {
    it('should return all categories with counts', async () => {
      const mockCategories = [
        { category: 'mountain', count: 5 },
        { category: 'road', count: 3 },
      ];
      mockProductRepository.getCategories.mockResolvedValue(mockCategories);

      const result = await productService.getCategories();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('count');
    });
  });
});
