import api from './api';
import type { ApiResponse, User, AuthTokens } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<AuthTokens & { user: User }>> {
    const response = await api.post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthTokens & { user: User }>> {
    const response = await api.post<ApiResponse<AuthTokens & { user: User }>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>('/users/me', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default authService;
