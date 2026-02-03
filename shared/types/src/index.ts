// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAddress {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  brand: string;
  images: string[];
  specifications: BikeSpecifications;
  stock: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 'mountain' | 'road' | 'hybrid' | 'electric' | 'kids';

export interface BikeSpecifications {
  frameSize: string;
  wheelSize: string;
  weight: number;
  material: string;
  gears: number;
  color: string;
}

// Cart types
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: UserAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  name: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
