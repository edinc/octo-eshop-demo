import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartService } from '../../src/services/cartService';

describe('CartService', () => {
  let cartService: CartService;
  let mockRedis: {
    get: ReturnType<typeof vi.fn>;
    setex: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };
  const mockProductServiceUrl = 'http://localhost:3002';

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cartService = new CartService(mockRedis as any, mockProductServiceUrl);
  });

  describe('getCart', () => {
    it('should return empty cart when no cart exists', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cartService.getCart('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.items).toHaveLength(0);
    });

    it('should return existing cart', async () => {
      const existingCart = {
        id: 'user-123',
        userId: 'user-123',
        items: [{ productId: 'prod-1', quantity: 2, price: 100, name: 'Bike' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));

      const result = await cartService.getCart('user-123');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod-1');
    });
  });

  describe('updateItem', () => {
    it('should update item quantity', async () => {
      const existingCart = {
        id: 'user-123',
        userId: 'user-123',
        items: [{ productId: 'prod-1', quantity: 2, price: 100, name: 'Bike' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cartService.updateItem('user-123', 'prod-1', 5);

      expect(result.items[0].quantity).toBe(5);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should remove item when quantity is 0', async () => {
      const existingCart = {
        id: 'user-123',
        userId: 'user-123',
        items: [{ productId: 'prod-1', quantity: 2, price: 100, name: 'Bike' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cartService.updateItem('user-123', 'prod-1', 0);

      expect(result.items).toHaveLength(0);
    });

    it('should throw error when item not in cart', async () => {
      const existingCart = {
        id: 'user-123',
        userId: 'user-123',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));

      await expect(cartService.updateItem('user-123', 'prod-999', 1)).rejects.toThrow(
        'Item not found in cart'
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const existingCart = {
        id: 'user-123',
        userId: 'user-123',
        items: [
          { productId: 'prod-1', quantity: 2, price: 100, name: 'Bike 1' },
          { productId: 'prod-2', quantity: 1, price: 200, name: 'Bike 2' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cartService.removeItem('user-123', 'prod-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod-2');
    });
  });

  describe('clearCart', () => {
    it('should delete cart from Redis', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cartService.clearCart('user-123');

      expect(mockRedis.del).toHaveBeenCalledWith('cart:user-123');
    });
  });

  describe('getCartTotal', () => {
    it('should calculate total correctly', async () => {
      const existingCart = {
        id: 'user-123',
        userId: 'user-123',
        items: [
          { productId: 'prod-1', quantity: 2, price: 100, name: 'Bike 1' },
          { productId: 'prod-2', quantity: 1, price: 200, name: 'Bike 2' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));

      const total = await cartService.getCartTotal('user-123');

      expect(total).toBe(400); // 2*100 + 1*200
    });

    it('should return 0 for empty cart', async () => {
      mockRedis.get.mockResolvedValue(null);

      const total = await cartService.getCartTotal('user-123');

      expect(total).toBe(0);
    });
  });
});
