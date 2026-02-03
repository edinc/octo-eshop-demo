import api from './api';
import type { ApiResponse, Cart, CartItem } from '@/types';

export const cartService = {
  async getCart(): Promise<ApiResponse<Cart>> {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data;
  },

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<Cart>> {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', { productId, quantity });
    return response.data;
  },

  async updateCartItem(productId: string, quantity: number): Promise<ApiResponse<Cart>> {
    const response = await api.put<ApiResponse<Cart>>(`/cart/items/${productId}`, { quantity });
    return response.data;
  },

  async removeFromCart(productId: string): Promise<ApiResponse<Cart>> {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`);
    return response.data;
  },

  async clearCart(): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>('/cart');
    return response.data;
  },

  // Local cart operations for non-authenticated users
  getLocalCart(): CartItem[] {
    try {
      const cart = localStorage.getItem('cart');
      if (!cart) return [];

      const parsed = JSON.parse(cart);

      // Validate it's an array with expected CartItem properties
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item): item is CartItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.productId === 'string' &&
          typeof item.quantity === 'number' &&
          typeof item.price === 'number' &&
          typeof item.name === 'string'
      );
    } catch {
      // If parsing fails or data is corrupted, return empty cart
      localStorage.removeItem('cart');
      return [];
    }
  },

  setLocalCart(items: CartItem[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
  },

  clearLocalCart(): void {
    localStorage.removeItem('cart');
  },
};

export default cartService;
