import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export class ProductServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.productServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Auth': config.serviceAuthToken,
      },
    });
  }

  async getProduct(productId: string): Promise<Product> {
    const response = await this.client.get(`/api/products/${productId}`);
    return response.data.data;
  }

  async reserveStock(productId: string, quantity: number): Promise<void> {
    await this.client.post(`/api/products/${productId}/reserve`, { quantity });
  }

  async releaseStock(productId: string, quantity: number): Promise<void> {
    await this.client.post(`/api/products/${productId}/release`, { quantity });
  }
}
