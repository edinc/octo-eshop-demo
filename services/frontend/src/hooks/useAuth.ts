import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RootState } from '@/store';
import { setCredentials, logout as logoutAction, setUser } from '@/store/authSlice';
import authService from '@/services/authService';
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

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: response => {
      if (response.success && response.data) {
        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          })
        );
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterFormData, 'confirmPassword'>) => authService.register(data),
    onSuccess: response => {
      if (response.success && response.data) {
        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          })
        );
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
