import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCart } from './useCart';
import { addItem, clearCart, removeItem, updateItemQuantity } from '@/store/cartSlice';
import { addToast } from '@/store/uiSlice';
import cartService from '@/services/cartService';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CartItem } from '@/types';

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/services/cartService', () => ({
  default: {
    getLocalCart: vi.fn(() => []),
    setLocalCart: vi.fn(),
    clearLocalCart: vi.fn(),
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateCartItem: vi.fn(),
    clearCart: vi.fn(),
  },
}));

type MockState = {
  cart: {
    items: Array<{ productId: string; quantity: number; price: number; name: string }>;
    isLoading: boolean;
  };
  auth: {
    isAuthenticated: boolean;
  };
};

const mockedUseDispatch = useDispatch as unknown as ReturnType<typeof vi.fn>;
const mockedUseSelector = useSelector as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;
const mockedUseQueryClient = useQueryClient as unknown as ReturnType<typeof vi.fn>;
const mockedCartService = cartService as unknown as {
  getLocalCart: ReturnType<typeof vi.fn>;
  setLocalCart: ReturnType<typeof vi.fn>;
  clearLocalCart: ReturnType<typeof vi.fn>;
  addToCart: ReturnType<typeof vi.fn>;
  removeFromCart: ReturnType<typeof vi.fn>;
  updateCartItem: ReturnType<typeof vi.fn>;
  clearCart: ReturnType<typeof vi.fn>;
};

describe('useCart', () => {
  let state: MockState;
  const dispatch = vi.fn();
  const invalidateQueries = vi.fn();
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      cart: {
        items: [
          { productId: 'p1', quantity: 2, price: 100, name: 'Bike' },
          { productId: 'p2', quantity: 1, price: 50, name: 'Helmet' },
        ],
        isLoading: false,
      },
      auth: {
        isAuthenticated: false,
      },
    };

    mockedUseDispatch.mockReturnValue(dispatch);
    mockedUseSelector.mockImplementation(selector => selector(state));
    mockedUseQueryClient.mockReturnValue({ invalidateQueries });
    mockedUseMutation.mockImplementation(config => ({
      mutate: (item: unknown) => {
        mutate(item);
        config.onSuccess?.();
      },
    }));
  });

  it('returns derived totals from cart items', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalPrice).toBe(250);
  });

  it('adds item and toast without server call when unauthenticated', () => {
    const item: CartItem = { productId: 'p3', quantity: 1, price: 75, name: 'Gloves' };
    const { result } = renderHook(() => useCart());

    result.current.addToCart(item);

    expect(dispatch).toHaveBeenCalledWith(addItem(item));
    expect(dispatch).toHaveBeenCalledWith(
      addToast({ type: 'success', message: 'Gloves added to cart' })
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it('adds item and syncs server cart when authenticated', () => {
    state.auth.isAuthenticated = true;
    const item: CartItem = { productId: 'p3', quantity: 1, price: 75, name: 'Gloves' };
    const { result } = renderHook(() => useCart());

    result.current.addToCart(item);

    expect(mutate).toHaveBeenCalledWith(item);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cart'] });
  });

  it('updates quantity and delegates remove for non-positive values', () => {
    state.auth.isAuthenticated = true;
    const { result } = renderHook(() => useCart());

    result.current.updateQuantity('p1', 3);
    expect(dispatch).toHaveBeenCalledWith(updateItemQuantity({ productId: 'p1', quantity: 3 }));
    expect(mockedCartService.updateCartItem).toHaveBeenCalledWith('p1', 3);

    result.current.updateQuantity('p1', 0);
    expect(dispatch).toHaveBeenCalledWith(removeItem('p1'));
    expect(mockedCartService.removeFromCart).toHaveBeenCalledWith('p1');
  });

  it('clears cart and syncs server when authenticated', () => {
    state.auth.isAuthenticated = true;
    const { result } = renderHook(() => useCart());

    result.current.clearCart();

    expect(dispatch).toHaveBeenCalledWith(clearCart());
    expect(mockedCartService.clearCart).toHaveBeenCalledOnce();
  });
});
