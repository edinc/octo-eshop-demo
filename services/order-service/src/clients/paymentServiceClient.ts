import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';

const ALLOWED_PAYMENT_HOSTS = [
  'payment-service',
  'localhost',
  'payment-service.octo-eshop-dev.svc.cluster.local',
  'payment-service.octo-eshop-staging.svc.cluster.local',
  'payment-service.octo-eshop-production.svc.cluster.local',
];

function validateServiceUrl(url: string): string {
  const parsed = new URL(url);
  if (!ALLOWED_PAYMENT_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Untrusted payment service host: ${parsed.hostname}`);
  }
  return url;
}

interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  cardToken: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class PaymentServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: validateServiceUrl(config.paymentServiceUrl),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Auth': config.serviceAuthToken,
      },
    });
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentResult> {
    try {
      const response = await this.client.post('/api/payments', request);
      return {
        success: true,
        transactionId: response.data.data.transactionId,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      return {
        success: false,
        error: axiosError.response?.data?.error?.message || 'Payment failed',
      };
    }
  }

  async refund(orderId: string): Promise<PaymentResult> {
    try {
      const response = await this.client.post(`/api/payments/order/${orderId}/refund`);
      return {
        success: true,
        transactionId: response.data.data.transactionId,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      return {
        success: false,
        error: axiosError.response?.data?.error?.message || 'Refund failed',
      };
    }
  }
}
