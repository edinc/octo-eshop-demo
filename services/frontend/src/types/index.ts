// Re-export from shared types
export type {
  User,
  UserAddress,
  Product,
  ProductCategory,
  BikeSpecifications,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  ApiResponse,
  ApiError,
  PaginationMeta,
  AuthTokens,
  JwtPayload,
} from '@octo-eshop/types';

// Frontend-specific types
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface AuthState {
  user: import('@octo-eshop/types').User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartState {
  items: import('@octo-eshop/types').CartItem[];
  isLoading: boolean;
}

export interface UiState {
  isSidebarOpen: boolean;
  isCartOpen: boolean;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
