import { describe, it, expect } from 'vitest';
import { PaymentService } from '../../src/services/paymentService';

describe('PaymentService', () => {
  const paymentService = new PaymentService();

  describe('processPayment', () => {
    it('should process valid payment successfully', async () => {
      const result = await paymentService.processPayment({
        orderId: 'order-123',
        amount: 199.99,
        currency: 'USD',
        cardToken: 'tok_valid_card',
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.transactionId).toMatch(/^txn_/);
    });

    it('should fail payment with insufficient funds token', async () => {
      const result = await paymentService.processPayment({
        orderId: 'order-123',
        amount: 199.99,
        currency: 'USD',
        cardToken: 'fail_insufficient_funds',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });

    it('should fail payment with declined card token', async () => {
      const result = await paymentService.processPayment({
        orderId: 'order-123',
        amount: 199.99,
        currency: 'USD',
        cardToken: 'fail_card_declined',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
    });

    it('should fail payment with expired card token', async () => {
      const result = await paymentService.processPayment({
        orderId: 'order-456',
        amount: 100,
        currency: 'USD',
        cardToken: 'fail_expired_card',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card has expired');
    });

    it('should store payment record after successful payment', async () => {
      const orderId = `order-${Date.now()}`;
      await paymentService.processPayment({
        orderId,
        amount: 50.0,
        currency: 'USD',
        cardToken: 'tok_valid',
      });

      const payment = await paymentService.getPaymentByOrder(orderId);
      expect(payment).not.toBeNull();
      expect(payment?.orderId).toBe(orderId);
      expect(payment?.amount).toBe(50.0);
      expect(payment?.status).toBe('completed');
    });
  });

  describe('refund', () => {
    it('should refund completed payment', async () => {
      // First process a payment
      const orderId = `order-refund-${Date.now()}`;
      await paymentService.processPayment({
        orderId,
        amount: 99.99,
        currency: 'USD',
        cardToken: 'tok_valid',
      });

      // Get the payment
      const payment = await paymentService.getPaymentByOrder(orderId);
      expect(payment).not.toBeNull();

      // Refund it
      const result = await paymentService.refund({ paymentId: payment!.id });
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^ref_/);

      // Verify status changed
      const updatedPayment = await paymentService.getPayment(payment!.id);
      expect(updatedPayment?.status).toBe('refunded');
    });

    it('should fail refund for non-existent payment', async () => {
      const result = await paymentService.refund({ paymentId: 'non-existent' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });

    it('should fail refund for already refunded payment', async () => {
      // Process and refund a payment
      const orderId = `order-double-refund-${Date.now()}`;
      await paymentService.processPayment({
        orderId,
        amount: 50,
        currency: 'USD',
        cardToken: 'tok_valid',
      });
      const payment = await paymentService.getPaymentByOrder(orderId);
      await paymentService.refund({ paymentId: payment!.id });

      // Try to refund again
      const result = await paymentService.refund({ paymentId: payment!.id });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment cannot be refunded');
    });
  });

  describe('refundByOrderId', () => {
    it('should refund payment by order ID', async () => {
      const orderId = `order-by-id-${Date.now()}`;
      await paymentService.processPayment({
        orderId,
        amount: 75,
        currency: 'USD',
        cardToken: 'tok_valid',
      });

      const result = await paymentService.refundByOrderId(orderId);
      expect(result.success).toBe(true);
    });

    it('should fail if no payment found for order', async () => {
      const result = await paymentService.refundByOrderId('non-existent-order');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No payment found for this order');
    });
  });
});
