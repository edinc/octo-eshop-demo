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
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  },

  setLocalCart(items: CartItem[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
  },

  clearLocalCart(): void {
    localStorage.removeItem('cart');
  },
};

export default cartService;
