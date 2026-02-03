import { PrismaClient, OrderStatus as PrismaOrderStatus } from '.prisma/client-order';
import { Decimal } from '.prisma/client-order/runtime/library';

const prisma = new PrismaClient();

export interface CreateOrderInput {
  userId: string;
  totalAmount: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface OrderWithDetails {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}

function mapOrder(order: {
  id: string;
  userId: string;
  status: PrismaOrderStatus;
  totalAmount: Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: Decimal;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}): OrderWithDetails {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
    })),
    shippingAddress: order.shippingAddress,
  };
}

export class OrderRepository {
  async create(input: CreateOrderInput): Promise<OrderWithDetails> {
    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        totalAmount: input.totalAmount,
        items: {
          create: input.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          })),
        },
        shippingAddress: {
          create: input.shippingAddress,
        },
        statusHistory: {
          create: {
            status: 'pending',
            note: 'Order created',
          },
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return mapOrder(order);
  }

  async findById(id: string): Promise<OrderWithDetails | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    if (!order) return null;
    return mapOrder(order);
  }

  async findByUser(
    userId: string,
    options: { page: number; limit: number; status?: string }
  ): Promise<{ orders: OrderWithDetails[]; total: number }> {
    const where: { userId: string; status?: PrismaOrderStatus } = { userId };
    if (options.status) {
      where.status = options.status as PrismaOrderStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          shippingAddress: true,
        },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(mapOrder),
      total,
    };
  }

  async updateStatus(id: string, status: string, note?: string): Promise<OrderWithDetails> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyData: any = {
      status: status as PrismaOrderStatus,
    };
    if (note !== undefined) {
      historyData.note = note;
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status as PrismaOrderStatus,
        statusHistory: {
          create: historyData,
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return mapOrder(order);
  }

  async createPayment(orderId: string, amount: number, transactionId: string): Promise<void> {
    await prisma.payment.create({
      data: {
        orderId,
        amount,
        status: 'completed',
        transactionId,
      },
    });
  }
}
