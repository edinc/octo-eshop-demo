import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RootState } from '@/store';
import { setCredentials, logout as logoutAction, setUser } from '@/store/authSlice';
import { setCartItems } from '@/store/cartSlice';
import authService from '@/services/authService';
import cartService from '@/services/cartService';
import type { LoginFormData, RegisterFormData } from '@/utils/validators';

export function useAuth() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated && !user,
    retry: false,
  });

  if (profileData?.data && !user) {
    dispatch(setUser(profileData.data));
  }

  // Sync local cart to server after authentication
  const syncCartAfterAuth = useCallback(async () => {
    const localCart = cartService.getLocalCart();
    if (localCart.length > 0) {
      try {
        // Add each local cart item to server cart
        for (const item of localCart) {
          await cartService.addToCart(item.productId, item.quantity);
        }
        // Clear local cart after syncing
        cartService.clearLocalCart();
      } catch (error) {
        console.error('Failed to sync cart:', error);
      }
    }
    // Fetch the updated server cart
    try {
      const serverCart = await cartService.getCart();
      if (serverCart.data) {
        dispatch(setCartItems(serverCart.data.items));
      }
    } catch (error) {
      console.error('Failed to fetch server cart:', error);
    }
  }, [dispatch]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: async response => {
      if (response.success && response.data) {
        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          })
        );
        // Sync cart after successful login
        await syncCartAfterAuth();
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, 'confirmPassword'>) => authService.register(data),
    onSuccess: async response => {
      if (response.success && response.data) {
        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          })
        );
        // Sync cart after successful registration
        await syncCartAfterAuth();
      }
    },
  });

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch(logoutAction());
    queryClient.clear();
  }, [dispatch, queryClient]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
