import { beforeEach, describe, expect, it, vi } from 'vitest';
import cartService from './cartService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockedApi = api as unknown as ApiMock;

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls cart API endpoints', async () => {
    mockedApi.get.mockResolvedValue({ data: { success: true } });
    mockedApi.post.mockResolvedValue({ data: { success: true } });
    mockedApi.put.mockResolvedValue({ data: { success: true } });
    mockedApi.delete.mockResolvedValue({ data: { success: true } });

    await cartService.getCart();
    await cartService.addToCart('p1', 2);
    await cartService.updateCartItem('p1', 3);
    await cartService.removeFromCart('p1');
    await cartService.clearCart();

    expect(mockedApi.get).toHaveBeenCalledWith('/cart');
    expect(mockedApi.post).toHaveBeenCalledWith('/cart/items', { productId: 'p1', quantity: 2 });
    expect(mockedApi.put).toHaveBeenCalledWith('/cart/items/p1', { quantity: 3 });
    expect(mockedApi.delete).toHaveBeenNthCalledWith(1, '/cart/items/p1');
    expect(mockedApi.delete).toHaveBeenNthCalledWith(2, '/cart');
  });

  it('handles local cart read/write/clear and filters invalid items', () => {
    expect(cartService.getLocalCart()).toEqual([]);

    localStorage.setItem(
      'cart',
      JSON.stringify([{ productId: 'p1', quantity: 1, price: 10, name: 'Bike' }, { invalid: true }])
    );
    expect(cartService.getLocalCart()).toEqual([
      { productId: 'p1', quantity: 1, price: 10, name: 'Bike' },
    ]);

    cartService.setLocalCart([{ productId: 'p2', quantity: 2, price: 50, name: 'Helmet' }]);
    expect(localStorage.getItem('cart')).toContain('p2');

    cartService.clearLocalCart();
    expect(localStorage.getItem('cart')).toBeNull();
  });

  it('returns empty cart and removes corrupted local data', () => {
    localStorage.setItem('cart', '{broken json');
    expect(cartService.getLocalCart()).toEqual([]);
    expect(localStorage.getItem('cart')).toBeNull();
  });
});
