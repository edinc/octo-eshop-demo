# Phase 3: Order & Payment Services

## Overview
Implement the Order Service for managing customer orders and a mock Payment Service for processing payments during development.

## Prerequisites
- Phase 2 completed (User, Product, Cart services)
- Understanding of saga pattern for distributed transactions

---

## Tasks

### 3.1 Order Service Implementation

**Objective:** Build order management service with full order lifecycle.

#### Directory Structure:
```
services/order-service/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   ├── controllers/
│   │   └── orderController.ts
│   ├── services/
│   │   ├── orderService.ts
│   │   └── orderSaga.ts
│   ├── repositories/
│   │   └── orderRepository.ts
│   ├── middleware/
│   ├── routes/
│   │   └── orderRoutes.ts
│   ├── events/
│   │   ├── publisher.ts
│   │   └── handlers.ts
│   └── types/
│       └── index.ts
├── tests/
├── prisma/
│   └── schema.prisma
├── Dockerfile
└── package.json
```

#### File: `services/order-service/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Order {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  status          OrderStatus @default(pending)
  totalAmount     Decimal     @db.Decimal(10, 2) @map("total_amount")
  currency        String      @default("USD")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  items           OrderItem[]
  shippingAddress ShippingAddress?
  statusHistory   OrderStatusHistory[]
  payment         Payment?

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id              String  @id @default(uuid())
  orderId         String  @map("order_id")
  productId       String  @map("product_id")
  productName     String  @map("product_name")
  quantity        Int
  priceAtPurchase Decimal @db.Decimal(10, 2) @map("price_at_purchase")

  order           Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_items")
}

model ShippingAddress {
  id         String @id @default(uuid())
  orderId    String @unique @map("order_id")
  street     String
  city       String
  state      String
  postalCode String @map("postal_code")
  country    String

  order      Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("shipping_addresses")
}

model OrderStatusHistory {
  id        String      @id @default(uuid())
  orderId   String      @map("order_id")
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now()) @map("created_at")

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_status_history")
}

model Payment {
  id            String        @id @default(uuid())
  orderId       String        @unique @map("order_id")
  amount        Decimal       @db.Decimal(10, 2)
  currency      String        @default("USD")
  status        PaymentStatus @default(pending)
  transactionId String?       @map("transaction_id")
  failureReason String?       @map("failure_reason")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("payments")
}

enum OrderStatus {
  pending
  paid
  processing
  shipped
  delivered
  cancelled
  refunded
}

enum PaymentStatus {
  pending
  completed
  failed
  refunded
}
```

#### File: `services/order-service/src/services/orderService.ts`
```typescript
import { OrderRepository } from '../repositories/orderRepository';
import { CartServiceClient } from '../clients/cartServiceClient';
import { PaymentServiceClient } from '../clients/paymentServiceClient';
import { ProductServiceClient } from '../clients/productServiceClient';
import { Order, OrderStatus, UserAddress } from '@octo-eshop/types';
import { EventPublisher } from '../events/publisher';

interface CreateOrderInput {
  userId: string;
  shippingAddress: UserAddress;
}

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private cartClient: CartServiceClient,
    private paymentClient: PaymentServiceClient,
    private productClient: ProductServiceClient,
    private eventPublisher: EventPublisher
  ) {}

  async createOrder(input: CreateOrderInput): Promise<Order> {
    // 1. Get cart items
    const cart = await this.cartClient.getCart(input.userId);
    
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

    // 3. Calculate total
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 4. Create order
    const order = await this.orderRepository.create({
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

    // 5. Publish order created event
    await this.eventPublisher.publish('order.created', {
      orderId: order.id,
      userId: input.userId,
      totalAmount,
      items: cart.items,
    });

    return order;
  }

  async processPayment(orderId: string, paymentDetails: { cardToken: string }): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order cannot be paid');
    }

    try {
      // Process payment
      const paymentResult = await this.paymentClient.processPayment({
        orderId,
        amount: Number(order.totalAmount),
        currency: order.currency,
        cardToken: paymentDetails.cardToken,
      });

      if (paymentResult.success) {
        // Update order status
        await this.orderRepository.updateStatus(orderId, 'paid', 'Payment successful');
        
        // Reserve inventory
        for (const item of order.items) {
          await this.productClient.reserveStock(item.productId, item.quantity);
        }

        // Clear cart
        await this.cartClient.clearCart(order.userId);

        // Publish payment success event
        await this.eventPublisher.publish('order.paid', {
          orderId,
          transactionId: paymentResult.transactionId,
        });

        return this.orderRepository.findById(orderId)!;
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
    } catch (error) {
      await this.orderRepository.updateStatus(orderId, 'pending', `Payment failed: ${error.message}`);
      throw error;
    }
  }

  async getOrder(orderId: string, userId: string): Promise<Order> {
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
    options: { page: number; limit: number; status?: OrderStatus }
  ): Promise<{ orders: Order[]; total: number }> {
    return this.orderRepository.findByUser(userId, options);
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    note?: string
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    await this.orderRepository.updateStatus(orderId, status, note);
    
    // Publish status change event
    await this.eventPublisher.publish('order.status.changed', {
      orderId,
      previousStatus: order.status,
      newStatus: status,
    });

    return this.orderRepository.findById(orderId)!;
  }

  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<Order> {
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

    // If paid, process refund
    if (order.status === 'paid') {
      await this.paymentClient.refund(orderId);
      
      // Release reserved inventory
      for (const item of order.items) {
        await this.productClient.releaseStock(item.productId, item.quantity);
      }
    }

    await this.orderRepository.updateStatus(orderId, 'cancelled', reason);
    
    await this.eventPublisher.publish('order.cancelled', {
      orderId,
      reason,
    });

    return this.orderRepository.findById(orderId)!;
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
```

#### File: `services/order-service/src/controllers/orderController.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { successResponse, paginationMeta } from '@octo-eshop/utils';
import { z } from 'zod';

const createOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
});

const processPaymentSchema = z.object({
  cardToken: z.string().min(1),
});

export class OrderController {
  constructor(private orderService: OrderService) {}

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const data = createOrderSchema.parse(req.body);
      
      const order = await this.orderService.createOrder({
        userId,
        shippingAddress: { ...data.shippingAddress, id: '', userId, isDefault: false },
      });
      
      res.status(201).json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const data = processPaymentSchema.parse(req.body);
      
      const order = await this.orderService.processPayment(orderId, data);
      
      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;
      
      const order = await this.orderService.getOrder(orderId, userId);
      
      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as string | undefined;
      
      const { orders, total } = await this.orderService.listOrders(userId, {
        page,
        limit,
        status: status as any,
      });
      
      res.json(successResponse(orders, paginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { orderId } = req.params;
      const { reason } = req.body;
      
      const order = await this.orderService.cancelOrder(orderId, userId, reason);
      
      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoint
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { status, note } = req.body;
      
      const order = await this.orderService.updateStatus(orderId, status, note);
      
      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };
}
```

#### File: `services/order-service/src/routes/orderRoutes.ts`
```typescript
import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Initialize dependencies (in real app, use DI container)
const orderController = new OrderController(/* dependencies */);

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', orderController.createOrder);
router.get('/', orderController.listOrders);
router.get('/:orderId', orderController.getOrder);
router.post('/:orderId/pay', orderController.processPayment);
router.post('/:orderId/cancel', orderController.cancelOrder);

// Admin routes
router.put('/:orderId/status', requireAdmin, orderController.updateStatus);

export { router as orderRoutes };
```

---

### 3.2 Payment Service (Mock) Implementation

**Objective:** Create a mock payment service that simulates payment gateway behavior.

#### Directory Structure:
```
services/payment-service/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config/
│   ├── controllers/
│   │   └── paymentController.ts
│   ├── services/
│   │   └── paymentService.ts
│   ├── routes/
│   │   └── paymentRoutes.ts
│   └── types/
├── tests/
├── Dockerfile
└── package.json
```

#### File: `services/payment-service/src/services/paymentService.ts`
```typescript
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
  amount?: number;  // Partial refund if specified
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

// In-memory store for mock payments (use Redis/DB in production)
const payments: Map<string, PaymentRecord> = new Map();

export class PaymentService {
  /**
   * Mock payment processing
   * Simulates various scenarios based on card token
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate processing delay
    await this.simulateDelay(500, 1500);

    // Mock scenarios based on card token
    if (request.cardToken.startsWith('fail_')) {
      return {
        success: false,
        error: this.getFailureReason(request.cardToken),
      };
    }

    if (request.cardToken.startsWith('delay_')) {
      await this.simulateDelay(3000, 5000);
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

    return {
      success: true,
      transactionId,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    return payments.get(paymentId) || null;
  }

  async getPaymentByOrder(orderId: string): Promise<PaymentRecord | null> {
    for (const payment of payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return null;
  }

  async refund(request: RefundRequest): Promise<PaymentResult> {
    await this.simulateDelay(300, 800);

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
```

#### File: `services/payment-service/src/controllers/paymentController.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { successResponse, errorResponse } from '@octo-eshop/utils';
import { z } from 'zod';

const processPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  cardToken: z.string().min(1),
});

const refundSchema = z.object({
  amount: z.number().positive().optional(),
});

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = processPaymentSchema.parse(req.body);
      const result = await this.paymentService.processPayment(data);

      if (result.success) {
        res.json(successResponse({
          transactionId: result.transactionId,
          status: 'completed',
        }));
      } else {
        res.status(400).json(errorResponse({
          code: 'PAYMENT_FAILED',
          message: result.error || 'Payment failed',
        }));
      }
    } catch (error) {
      next(error);
    }
  };

  getPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.getPayment(req.params.id);
      
      if (!payment) {
        res.status(404).json(errorResponse({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        }));
        return;
      }

      res.json(successResponse(payment));
    } catch (error) {
      next(error);
    }
  };

  refund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = refundSchema.parse(req.body);
      
      const result = await this.paymentService.refund({
        paymentId: id,
        amount: data.amount,
      });

      if (result.success) {
        res.json(successResponse({
          transactionId: result.transactionId,
          status: 'refunded',
        }));
      } else {
        res.status(400).json(errorResponse({
          code: 'REFUND_FAILED',
          message: result.error || 'Refund failed',
        }));
      }
    } catch (error) {
      next(error);
    }
  };
}
```

#### File: `services/payment-service/src/routes/paymentRoutes.ts`
```typescript
import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { PaymentService } from '../services/paymentService';
import { authenticateService } from '../middleware/serviceAuth';

const router = Router();
const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

// Service-to-service authentication (internal API)
router.use(authenticateService);

router.post('/', paymentController.processPayment);
router.get('/:id', paymentController.getPayment);
router.post('/:id/refund', paymentController.refund);

export { router as paymentRoutes };
```

---

### 3.3 Event Publishing Setup

**Objective:** Set up event-driven communication between services.

#### File: `services/order-service/src/events/publisher.ts`
```typescript
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { config } from '../config';

export interface OrderEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

export class EventPublisher {
  private client: ServiceBusClient;
  private sender: ServiceBusSender;

  constructor() {
    this.client = new ServiceBusClient(config.serviceBusConnectionString);
    this.sender = this.client.createSender(config.orderEventsTopic);
  }

  async publish(eventType: string, data: Record<string, unknown>): Promise<void> {
    const event: OrderEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
      correlationId: data.orderId as string || crypto.randomUUID(),
    };

    await this.sender.sendMessages({
      body: event,
      contentType: 'application/json',
      subject: eventType,
      correlationId: event.correlationId,
    });

    console.log(`Published event: ${eventType}`, { correlationId: event.correlationId });
  }

  async close(): Promise<void> {
    await this.sender.close();
    await this.client.close();
  }
}

// For local development without Azure Service Bus
export class LocalEventPublisher implements EventPublisher {
  async publish(eventType: string, data: Record<string, unknown>): Promise<void> {
    console.log(`[LOCAL] Event: ${eventType}`, data);
  }

  async close(): Promise<void> {
    // No-op
  }
}
```

---

### 3.4 Service Clients

**Objective:** Create HTTP clients for inter-service communication.

#### File: `services/order-service/src/clients/cartServiceClient.ts`
```typescript
import axios, { AxiosInstance } from 'axios';
import { Cart } from '@octo-eshop/types';
import { config } from '../config';

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
      params: { userId },
    });
    return response.data.data;
  }

  async clearCart(userId: string): Promise<void> {
    await this.client.delete('/api/cart', {
      headers: { 'X-Service-Auth': config.serviceAuthToken },
      params: { userId },
    });
  }
}
```

#### File: `services/order-service/src/clients/paymentServiceClient.ts`
```typescript
import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

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
      baseURL: config.paymentServiceUrl,
      timeout: 30000,  // Payment processing may take longer
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
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Payment failed',
      };
    }
  }

  async refund(orderId: string): Promise<PaymentResult> {
    try {
      const response = await this.client.post(`/api/payments/${orderId}/refund`);
      return {
        success: true,
        transactionId: response.data.data.transactionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Refund failed',
      };
    }
  }
}
```

---

## Testing Strategy

### Order Service Tests

#### File: `services/order-service/tests/unit/orderService.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../../src/services/orderService';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: any;
  let mockCartClient: any;
  let mockPaymentClient: any;
  let mockProductClient: any;
  let mockEventPublisher: any;

  beforeEach(() => {
    mockOrderRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUser: vi.fn(),
      updateStatus: vi.fn(),
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
    it('should create order from cart items', async () => {
      mockCartClient.getCart.mockResolvedValue({
        items: [
          { productId: 'p1', quantity: 2, price: 100, name: 'Bike 1' },
        ],
      });
      mockProductClient.getProduct.mockResolvedValue({ stock: 10 });
      mockOrderRepository.create.mockResolvedValue({
        id: 'order-123',
        status: 'pending',
        totalAmount: 200,
      });

      const result = await orderService.createOrder({
        userId: 'user-123',
        shippingAddress: {
          id: '',
          userId: 'user-123',
          street: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'USA',
          isDefault: false,
        },
      });

      expect(result.id).toBe('order-123');
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
          shippingAddress: {} as any,
        })
      ).rejects.toThrow('Cart is empty');
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
        });
      mockPaymentClient.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-123',
      });

      const result = await orderService.processPayment('order-123', {
        cardToken: 'tok_valid',
      });

      expect(result.status).toBe('paid');
      expect(mockCartClient.clearCart).toHaveBeenCalled();
      expect(mockProductClient.reserveStock).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order', async () => {
      mockOrderRepository.findById
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'pending',
          userId: 'user-123',
        })
        .mockResolvedValueOnce({
          id: 'order-123',
          status: 'cancelled',
        });

      const result = await orderService.cancelOrder('order-123', 'user-123', 'Changed mind');

      expect(result.status).toBe('cancelled');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'order.cancelled',
        expect.anything()
      );
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
        });

      await orderService.cancelOrder('order-123', 'user-123');

      expect(mockPaymentClient.refund).toHaveBeenCalled();
      expect(mockProductClient.releaseStock).toHaveBeenCalled();
    });
  });
});
```

### Payment Service Tests

#### File: `services/payment-service/tests/unit/paymentService.test.ts`
```typescript
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
  });

  describe('refund', () => {
    it('should refund completed payment', async () => {
      // First process a payment
      const payment = await paymentService.processPayment({
        orderId: 'order-456',
        amount: 99.99,
        currency: 'USD',
        cardToken: 'tok_valid',
      });

      // Then refund it (need to get payment ID from store)
      // This test would need adjustment for actual implementation
    });
  });
});
```

---

## Deliverables Checklist

### Order Service
- [ ] Database schema with Prisma migrations
- [ ] Create order from cart endpoint
- [ ] Process payment endpoint
- [ ] List user orders with pagination
- [ ] Get single order details
- [ ] Cancel order endpoint
- [ ] Admin: Update order status endpoint
- [ ] Order status history tracking
- [ ] Event publishing for order lifecycle
- [ ] Service clients for Cart, Payment, Product
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests

### Payment Service (Mock)
- [ ] Process payment endpoint
- [ ] Get payment status endpoint
- [ ] Refund endpoint
- [ ] Mock scenarios (success, various failures)
- [ ] Service authentication
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests

---

## docker-compose.yml Additions

```yaml
services:
  postgres-order:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orderdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5434:5432"
    volumes:
      - postgres-order-data:/var/lib/postgresql/data

  order-service:
    build:
      context: ./services/order-service
      dockerfile: Dockerfile
    ports:
      - "3003:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres-order:5432/orderdb
      CART_SERVICE_URL: http://cart-service:3000
      PAYMENT_SERVICE_URL: http://payment-service:3000
      PRODUCT_SERVICE_URL: http://product-service:3000
    depends_on:
      - postgres-order
      - cart-service
      - payment-service

  payment-service:
    build:
      context: ./services/payment-service
      dockerfile: Dockerfile
    ports:
      - "3004:3000"

volumes:
  postgres-order-data:
```

---

## Dependencies

**Depends on:**
- Phase 2: User, Product, Cart services

**Required by:**
- Phase 4: Frontend (checkout flow)
- Phase 5: Containerization
