import { generateId } from '@octo-eshop/utils';

interface PaymentRequest {
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

interface RefundRequest {
  paymentId: string;
  amount?: number;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: Date;
}

// In-memory store for mock payments
const payments: Map<string, PaymentRecord> = new Map();
const orderPayments: Map<string, string> = new Map(); // orderId -> paymentId

export class PaymentService {
  /**
   * Mock payment processing
   * Simulates various scenarios based on card token
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate processing delay
    await this.simulateDelay(100, 300);

    // Mock scenarios based on card token
    if (request.cardToken.startsWith('fail_')) {
      return {
        success: false,
        error: this.getFailureReason(request.cardToken),
      };
    }

    if (request.cardToken.startsWith('delay_')) {
      await this.simulateDelay(1000, 2000);
    }

    const transactionId = `txn_${generateId()}`;
    const paymentRecord: PaymentRecord = {
      id: generateId(),
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency,
      status: 'completed',
      transactionId,
      createdAt: new Date(),
    };

    payments.set(paymentRecord.id, paymentRecord);
    orderPayments.set(request.orderId, paymentRecord.id);

    return {
      success: true,
      transactionId,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    return payments.get(paymentId) || null;
  }

  async getPaymentByOrder(orderId: string): Promise<PaymentRecord | null> {
    const paymentId = orderPayments.get(orderId);
    if (!paymentId) return null;
    return payments.get(paymentId) || null;
  }

  async refund(request: RefundRequest): Promise<PaymentResult> {
    await this.simulateDelay(100, 300);

    const payment = payments.get(request.paymentId);

    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    if (payment.status !== 'completed') {
      return {
        success: false,
        error: 'Payment cannot be refunded',
      };
    }

    payment.status = 'refunded';
    payments.set(payment.id, payment);

    return {
      success: true,
      transactionId: `ref_${generateId()}`,
    };
  }

  async refundByOrderId(orderId: string): Promise<PaymentResult> {
    const paymentId = orderPayments.get(orderId);
    if (!paymentId) {
      return {
        success: false,
        error: 'No payment found for this order',
      };
    }
    return this.refund({ paymentId });
  }

  private getFailureReason(cardToken: string): string {
    const reasons: Record<string, string> = {
      fail_insufficient_funds: 'Insufficient funds',
      fail_card_declined: 'Card declined',
      fail_expired_card: 'Card has expired',
      fail_invalid_card: 'Invalid card number',
      fail_fraud: 'Transaction flagged as potentially fraudulent',
      fail_network: 'Network error occurred',
    };

    return reasons[cardToken] || 'Payment failed';
  }

  private simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
