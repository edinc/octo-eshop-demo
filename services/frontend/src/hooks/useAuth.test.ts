import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './useAuth';
import { setCredentials, setUser, logout as logoutAction } from '@/store/authSlice';
import { setCartItems } from '@/store/cartSlice';
import authService from '@/services/authService';
import cartService from '@/services/cartService';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CartItem, User } from '@/types';

vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

vi.mock('@/services/cartService', () => ({
  default: {
    getLocalCart: vi.fn(),
    addToCart: vi.fn(),
    clearLocalCart: vi.fn(),
    getCart: vi.fn(),
  },
}));

type MockState = {
  auth: {
    user: unknown;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
};

const mockedUseDispatch = useDispatch as unknown as ReturnType<typeof vi.fn>;
const mockedUseSelector = useSelector as unknown as ReturnType<typeof vi.fn>;
const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;
const mockedUseQueryClient = useQueryClient as unknown as ReturnType<typeof vi.fn>;
const mockedAuthService = authService as unknown as {
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  getProfile: ReturnType<typeof vi.fn>;
};
const mockedCartService = cartService as unknown as {
  getLocalCart: ReturnType<typeof vi.fn>;
  addToCart: ReturnType<typeof vi.fn>;
  clearLocalCart: ReturnType<typeof vi.fn>;
  getCart: ReturnType<typeof vi.fn>;
};

describe('useAuth', () => {
  let state: MockState;
  const dispatch = vi.fn();
  const clear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    state = {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      },
    };

    mockedUseDispatch.mockReturnValue(dispatch);
    mockedUseSelector.mockImplementation(selector => selector(state));
    mockedUseQueryClient.mockReturnValue({ clear });
    mockedUseQuery.mockReturnValue({ data: undefined });
    mockedUseMutation.mockImplementation(config => ({
      mutateAsync: async (payload: unknown) => {
        const result = await config.mutationFn(payload);
        if (config.onSuccess) {
          await config.onSuccess(result);
        }
        return result;
      },
      isPending: false,
      error: null,
    }));
    mockedCartService.getLocalCart.mockReturnValue([]);
    mockedCartService.getCart.mockResolvedValue({ data: { items: [] } });
  });

  it('sets profile query disabled when not authenticated', () => {
    renderHook(() => useAuth());
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['profile'],
        enabled: false,
      })
    );
  });

  it('dispatches setUser when profile data exists and user is missing', () => {
    const profileUser: User = {
      id: 'u1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    state.auth.isAuthenticated = true;
    mockedUseQuery.mockReturnValue({ data: { data: profileUser } });

    renderHook(() => useAuth());

    expect(dispatch).toHaveBeenCalledWith(setUser(profileUser));
  });

  it('dispatches credentials and syncs cart after successful login', async () => {
    const user: User = {
      id: 'u1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const syncedItems: CartItem[] = [{ productId: 'p1', quantity: 2, price: 100, name: 'Bike' }];
    mockedAuthService.login.mockResolvedValue({
      success: true,
      data: { user, accessToken: 'access', refreshToken: 'refresh' },
    });
    mockedCartService.getLocalCart.mockReturnValue([{ productId: 'p1', quantity: 2 }]);
    mockedCartService.getCart.mockResolvedValue({
      data: { items: syncedItems },
    });

    const { result } = renderHook(() => useAuth());

    await result.current.login({ email: 'jane@example.com', password: 'Password1' });

    expect(dispatch).toHaveBeenCalledWith(
      setCredentials({
        user,
        accessToken: 'access',
        refreshToken: 'refresh',
      })
    );
    expect(mockedCartService.addToCart).toHaveBeenCalledWith('p1', 2);
    expect(mockedCartService.clearLocalCart).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith(setCartItems(syncedItems));
  });

  it('logs out and clears query cache', async () => {
    mockedAuthService.logout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());

    await result.current.logout();

    expect(mockedAuthService.logout).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith(logoutAction());
    expect(clear).toHaveBeenCalledOnce();
  });
});
