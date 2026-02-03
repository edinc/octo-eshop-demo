import api from './api';
import type { ApiResponse, Order, PaginationMeta, UserAddress } from '@/types';

interface OrderListResponse {
  orders: Order[];
  meta: PaginationMeta;
}

interface CreateOrderRequest {
  shippingAddress: Omit<UserAddress, 'id' | 'userId' | 'isDefault'>;
  paymentMethod: string;
}

export const orderService = {
  async getOrders(page: number = 1, limit: number = 10): Promise<ApiResponse<OrderListResponse>> {
    const response = await api.get<ApiResponse<OrderListResponse>>(
      `/orders?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data;
  },
};

export default orderService;
