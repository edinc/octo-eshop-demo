import axios from 'axios';
import type { ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh state to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post<
            ApiResponse<{ accessToken: string; refreshToken: string }>
          >(`${API_BASE_URL}/auth/refresh`, { refreshToken });

          if (response.data.success && response.data.data) {
            const newAccessToken = response.data.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            onTokenRefreshed(newAccessToken);
            return api(originalRequest);
          }
        }
        throw new Error('No refresh token');
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        refreshSubscribers = [];
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
