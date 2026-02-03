import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../../src/services/orderService';

describe('OrderService', () => {
  let orderService: OrderService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockOrderRepository: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCartClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPaymentClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockProductClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEventPublisher: any;

  beforeEach(() => {
    mockOrderRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUser: vi.fn(),
      updateStatus: vi.fn(),
      createPayment: vi.fn(),
    };
    mockCartClient = {
      getCart: vi.fn(),
      clearCart: vi.fn(),
    };
    mockPaymentClient = {
      processPayment: vi.fn(),
      refund: vi.fn(),
    };
    mockProductClient = {
      getProduct: vi.fn(),
      reserveStock: vi.fn(),
      releaseStock: vi.fn(),
    };
    mockEventPublisher = {
      publish: vi.fn(),
    };

    orderService = new OrderService(
      mockOrderRepository,
      mockCartClient,
      mockPaymentClient,
      mockProductClient,
      mockEventPublisher
    );
  });

  describe('createOrder', () => {
    it('should create order from cart items and reserve stock', async () => {
      mockCartClient.getCart.mockResolvedValue({
        items: [{ productId: 'p1', quantity: 2, price: 100, name: 'Bike 1' }],
      });
      mockProductClient.getProduct.mockResolvedValue({ stock: 10 });
      mockProductClient.reserveStock.mockResolvedValue(undefined);
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-123',
        userId: 'user-123',
        status: 'pending',
        totalAmount: 200,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        shippingAddress: null,
      });

      const result = await orderService.createOrder({
        userId: 'user-123',
        authToken: 'token',
        shippingAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'USA',
        },
      });

      expect(result.id).toBe('order-123');
      expect(mockProductClient.reserveStock).toHaveBeenCalledWith('p1', 2);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'order.created',
        expect.objectContaining({ orderId: 'order-123' })
      );
    });

    it('should throw error if cart is empty', async () => {
      mockCartClient.getCart.mockResolvedValue({ items: [] });

      await expect(
        orderService.createOrder({
          userId: 'user-123',
          authToken: 'token',
          shippingAddress: {
            street: '123 Main St',
            city: 'City',
            state: 'State',
            postalCode: '12345',
            country: 'USA',
          },
        })
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw error if insufficient stock', async () => {
      mockCartClient.getCart.mockResolvedValue({
        items: [{ productId: 'p1', quantity: 10, price: 100, name: 'Bike 1' }],
      });
      mockProductClient.getProduct.mockResolvedValue({ stock: 5, name: 'Bike 1' });

      await expect(
        orderService.createOrder({
          userId: 'user-123',
          authToken: 'token',
          shippingAddress: {
            street: '123 Main St',
            city: 'City',
            state: 'State',
            postalCode: '12345',
            country: 'USA',
          },
        })
      ).rejects.toThrow('Insufficient stock');
    });

    it('should rollback stock reservations if order creation fails', async () => {
      mockCartClient.getCart.mockResolvedValue({
        items: [{ productId: 'p1', quantity: 2, price: 100, name: 'Bike 1' }],
      });
      mockProductClient.getProduct.mockResolvedValue({ stock: 10 });
      mockProductClient.reserveStock.mockResolvedValue(undefined);
      mockProductClient.releaseStock.mockResolvedValue(undefined);
      mockOrderRepository.create.mockRejectedValue(new Error('DB error'));

      await expect(
        orderService.createOrder({
          userId: 'user-123',
          authToken: 'token',
          shippingAddress: {
            street: '123 Main St',
            city: 'City',
            state: 'State',
            postalCode: '12345',
            country: 'USA',
          },
        })
      ).rejects.toThrow('DB error');

      expect(mockProductClient.releaseStock).toHaveBeenCalledWith('p1', 2);
    });
  });

  describe('processPayment', () => {
    it('should process payment and update order status', async () => {
      mockOrderRepository.findById
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'pending',
          totalAmount: 200,
          currency: 'USD',
          userId: 'user-123',
          items: [{ productId: 'p1', quantity: 2 }],
        })
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'paid',
          totalAmount: 200,
          currency: 'USD',
          userId: 'user-123',
          items: [{ productId: 'p1', quantity: 2 }],
        });
      mockPaymentClient.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-123',
      });

      const result = await orderService.processPayment(
        'order-123',
        { cardToken: 'tok_valid' },
        'auth-token'
      );

      expect(result.status).toBe('paid');
      expect(mockCartClient.clearCart).toHaveBeenCalledWith('user-123', 'auth-token');
      expect(mockOrderRepository.createPayment).toHaveBeenCalledWith('order-123', 200, 'txn-123');
    });

    it('should throw error if order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        orderService.processPayment('order-123', { cardToken: 'tok_valid' })
      ).rejects.toThrow('Order not found');
    });

    it('should throw error if order already paid', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-123',
        status: 'paid',
      });

      await expect(
        orderService.processPayment('order-123', { cardToken: 'tok_valid' })
      ).rejects.toThrow('Order cannot be paid');
    });

    it('should release stock and cancel order if payment fails', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-123',
        status: 'pending',
        totalAmount: 200,
        currency: 'USD',
        userId: 'user-123',
        items: [{ productId: 'p1', quantity: 2 }],
      });
      mockPaymentClient.processPayment.mockResolvedValue({
        success: false,
        error: 'Card declined',
      });
      mockProductClient.releaseStock.mockResolvedValue(undefined);

      await expect(
        orderService.processPayment('order-123', { cardToken: 'tok_invalid' })
      ).rejects.toThrow('Card declined');

      expect(mockProductClient.releaseStock).toHaveBeenCalledWith('p1', 2);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order-123',
        'cancelled',
        expect.stringContaining('Payment failed')
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order and release stock', async () => {
      mockOrderRepository.findById
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'pending',
          userId: 'user-123',
          items: [{ productId: 'p1', quantity: 2 }],
        })
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'cancelled',
          userId: 'user-123',
        });
      mockProductClient.releaseStock.mockResolvedValue(undefined);

      const result = await orderService.cancelOrder('order-123', 'user-123', 'Changed mind');

      expect(result.status).toBe('cancelled');
      expect(mockProductClient.releaseStock).toHaveBeenCalledWith('p1', 2);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('order.cancelled', expect.anything());
    });

    it('should refund if order was paid', async () => {
      mockOrderRepository.findById
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'paid',
          userId: 'user-123',
          items: [{ productId: 'p1', quantity: 2 }],
        })
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'cancelled',
          userId: 'user-123',
        });
      mockProductClient.releaseStock.mockResolvedValue(undefined);

      await orderService.cancelOrder('order-123', 'user-123');

      expect(mockPaymentClient.refund).toHaveBeenCalled();
      expect(mockProductClient.releaseStock).toHaveBeenCalled();
    });

    it('should throw error if unauthorized', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-123',
        status: 'pending',
        userId: 'different-user',
      });

      await expect(orderService.cancelOrder('order-123', 'user-123')).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should throw error if order cannot be cancelled', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-123',
        status: 'shipped',
        userId: 'user-123',
      });

      await expect(orderService.cancelOrder('order-123', 'user-123')).rejects.toThrow(
        'Order cannot be cancelled'
      );
    });
  });

  describe('getOrder', () => {
    it('should return order for authorized user', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-123',
        userId: 'user-123',
        status: 'pending',
      });

      const result = await orderService.getOrder('order-123', 'user-123');

      expect(result.id).toBe('order-123');
    });

    it('should throw error if unauthorized', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-123',
        userId: 'different-user',
      });

      await expect(orderService.getOrder('order-123', 'user-123')).rejects.toThrow('Unauthorized');
    });
  });
});
