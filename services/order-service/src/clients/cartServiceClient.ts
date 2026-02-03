import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
}

export class CartServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.cartServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Auth': config.serviceAuthToken,
      },
    });
  }

  async getCart(userId: string, authToken: string): Promise<Cart> {
    const response = await this.client.get('/api/cart', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data.data;
  }

  async clearCart(userId: string, authToken: string): Promise<void> {
    await this.client.delete('/api/cart', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Service-Auth': config.serviceAuthToken,
      },
    });
  }
}
