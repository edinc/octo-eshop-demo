import { OrderRepository, OrderWithDetails } from '../repositories/orderRepository';
import { CartServiceClient } from '../clients/cartServiceClient';
import { PaymentServiceClient } from '../clients/paymentServiceClient';
import { ProductServiceClient } from '../clients/productServiceClient';
import { EventPublisher } from '../events/publisher';

type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface CreateOrderInput {
  userId: string;
  authToken: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private cartClient: CartServiceClient,
    private paymentClient: PaymentServiceClient,
    private productClient: ProductServiceClient,
    private eventPublisher: EventPublisher
  ) {}

  async createOrder(input: CreateOrderInput): Promise<OrderWithDetails> {
    // 1. Get cart items
    const cart = await this.cartClient.getCart(input.userId, input.authToken);

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // 2. Validate stock availability
    for (const item of cart.items) {
      const product = await this.productClient.getProduct(item.productId);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    // 3. Reserve stock immediately to prevent overselling (optimistic reservation)
    // Stock will be released if payment fails or order is cancelled
    const reservedItems: { productId: string; quantity: number }[] = [];
    try {
      for (const item of cart.items) {
        await this.productClient.reserveStock(item.productId, item.quantity);
        reservedItems.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (error) {
      // Rollback any reservations made so far
      for (const reserved of reservedItems) {
        try {
          await this.productClient.releaseStock(reserved.productId, reserved.quantity);
        } catch {
          // Log but continue rollback - compensation job will handle orphaned reservations
        }
      }
      throw new Error('Failed to reserve inventory');
    }

    // 4. Calculate total
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 5. Create order
    let order: OrderWithDetails;
    try {
      order = await this.orderRepository.create({
        userId: input.userId,
        totalAmount,
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })),
        shippingAddress: input.shippingAddress,
      });
    } catch (error) {
      // Rollback stock reservations if order creation fails
      for (const reserved of reservedItems) {
        try {
          await this.productClient.releaseStock(reserved.productId, reserved.quantity);
        } catch {
          // Log error - compensation job will handle
        }
      }
      throw error;
    }

    // 6. Publish order created event
    await this.eventPublisher.publish('order.created', {
      orderId: order.id,
      userId: input.userId,
      totalAmount,
      items: cart.items,
    });

    return order;
  }

  async processPayment(
    orderId: string,
    paymentDetails: { cardToken: string },
    authToken?: string
  ): Promise<OrderWithDetails> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order cannot be paid');
    }

    // Process payment
    const paymentResult = await this.paymentClient.processPayment({
      orderId,
      amount: order.totalAmount,
      currency: order.currency,
      cardToken: paymentDetails.cardToken,
    });

    if (paymentResult.success && paymentResult.transactionId) {
      // Update order status
      await this.orderRepository.updateStatus(orderId, 'paid', 'Payment successful');

      // Record payment
      await this.orderRepository.createPayment(
        orderId,
        order.totalAmount,
        paymentResult.transactionId
      );

      // Clear cart (stock was already reserved during order creation)
      if (authToken) {
        await this.cartClient.clearCart(order.userId, authToken);
      }

      // Publish payment success event
      await this.eventPublisher.publish('order.paid', {
        orderId,
        transactionId: paymentResult.transactionId,
      });

      const updatedOrder = await this.orderRepository.findById(orderId);
      return updatedOrder!;
    } else {
      // Payment failed - release reserved stock
      for (const item of order.items) {
        try {
          await this.productClient.releaseStock(item.productId, item.quantity);
        } catch {
          // Log error - compensation job will handle orphaned reservations
        }
      }

      await this.orderRepository.updateStatus(
        orderId,
        'cancelled',
        `Payment failed: ${paymentResult.error}`
      );
      throw new Error(paymentResult.error || 'Payment failed');
    }
  }

  async getOrder(orderId: string, userId: string): Promise<OrderWithDetails> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return order;
  }

  async listOrders(
    userId: string,
    options: { page: number; limit: number; status?: string }
  ): Promise<{ orders: OrderWithDetails[]; total: number }> {
    return this.orderRepository.findByUser(userId, options);
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<OrderWithDetails> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status as OrderStatus, status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    await this.orderRepository.updateStatus(orderId, status, note);

    // Publish status change event
    await this.eventPublisher.publish('order.status.changed', {
      orderId,
      previousStatus: order.status,
      newStatus: status,
    });

    const updatedOrder = await this.orderRepository.findById(orderId);
    return updatedOrder!;
  }

  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<OrderWithDetails> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!['pending', 'paid'].includes(order.status)) {
      throw new Error('Order cannot be cancelled');
    }

    // Release reserved inventory (stock was reserved during order creation)
    const releaseErrors: string[] = [];
    for (const item of order.items) {
      try {
        await this.productClient.releaseStock(item.productId, item.quantity);
      } catch (error) {
        // Log error but continue - try to release all items
        releaseErrors.push(`Failed to release stock for ${item.productId}`);
      }
    }

    // If paid, process refund
    if (order.status === 'paid') {
      await this.paymentClient.refund(orderId);
    }

    // Update status even if some releases failed - compensation job will handle orphaned reservations
    const cancelNote =
      releaseErrors.length > 0
        ? `${reason || 'Cancelled'}. Note: ${releaseErrors.join('; ')}`
        : reason;

    await this.orderRepository.updateStatus(orderId, 'cancelled', cancelNote);

    await this.eventPublisher.publish('order.cancelled', {
      orderId,
      reason,
      releaseErrors: releaseErrors.length > 0 ? releaseErrors : undefined,
    });

    const updatedOrder = await this.orderRepository.findById(orderId);
    return updatedOrder!;
  }

  private isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['paid', 'cancelled'],
      paid: ['processing', 'cancelled', 'refunded'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}
