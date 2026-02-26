import { describe, it, expect, beforeEach, vi } from 'vitest';
import reducer, { addItem, updateItemQuantity, removeItem, clearCart, setLoading } from './cartSlice';
import cartService from '@/services/cartService';

vi.mock('@/services/cartService', () => ({
  default: {
    getLocalCart: vi.fn(() => []),
    setLocalCart: vi.fn(),
    clearLocalCart: vi.fn(),
  },
}));

describe('cartSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds new items and increments existing item quantity', () => {
    let state = reducer(
      undefined,
      addItem({ productId: 'p1', quantity: 1, price: 10, name: 'Bike' } as any)
    );
    state = reducer(state, addItem({ productId: 'p1', quantity: 2, price: 10, name: 'Bike' } as any));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(cartService.setLocalCart).toHaveBeenCalled();
  });

  it('updates and removes items by product id', () => {
    let state = reducer(
      { items: [{ productId: 'p1', quantity: 1 } as any], isLoading: false },
      updateItemQuantity({ productId: 'p1', quantity: 5 })
    );
    expect(state.items[0].quantity).toBe(5);

    state = reducer(state, removeItem('p1'));
    expect(state.items).toEqual([]);
  });

  it('clears cart and toggles loading state', () => {
    let state = reducer({ items: [{ productId: 'p1' } as any], isLoading: false }, clearCart());
    state = reducer(state, setLoading(true));

    expect(state.items).toEqual([]);
    expect(state.isLoading).toBe(true);
    expect(cartService.clearLocalCart).toHaveBeenCalledOnce();
  });
});
