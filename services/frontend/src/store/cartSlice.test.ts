import { describe, it, expect, beforeEach, vi } from 'vitest';
import reducer, { addItem, updateItemQuantity, removeItem, clearCart, setLoading } from './cartSlice';
import cartService from '@/services/cartService';
import type { CartItem, CartState } from '@/types';

vi.mock('@/services/cartService', () => ({
  default: {
    getLocalCart: vi.fn(() => []),
    setLocalCart: vi.fn(),
    clearLocalCart: vi.fn(),
  },
}));

describe('cartSlice', () => {
  const cartItem: CartItem = { productId: 'p1', quantity: 1, price: 10, name: 'Bike' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds new items and increments existing item quantity', () => {
    let state = reducer(undefined, addItem(cartItem));
    state = reducer(state, addItem({ ...cartItem, quantity: 2 }));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(cartService.setLocalCart).toHaveBeenCalled();
  });

  it('updates and removes items by product id', () => {
    const stateWithItem: CartState = { items: [cartItem], isLoading: false };
    let state = reducer(
      stateWithItem,
      updateItemQuantity({ productId: 'p1', quantity: 5 })
    );
    expect(state.items[0].quantity).toBe(5);

    state = reducer(state, removeItem('p1'));
    expect(state.items).toEqual([]);
  });

  it('clears cart and toggles loading state', () => {
    let state = reducer({ items: [cartItem], isLoading: false }, clearCart());
    state = reducer(state, setLoading(true));

    expect(state.items).toEqual([]);
    expect(state.isLoading).toBe(true);
    expect(cartService.clearLocalCart).toHaveBeenCalledOnce();
  });
});
