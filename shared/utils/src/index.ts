import { ApiResponse, ApiError, PaginationMeta } from '@octo-eshop/types';

export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  const response: ApiResponse<T> = { success: true, data };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return response;
}

export function errorResponse(error: ApiError): ApiResponse<never> {
  return { success: false, error };
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
