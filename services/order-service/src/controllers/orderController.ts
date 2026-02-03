import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { successResponse, paginationMeta } from '@octo-eshop/utils';
import { z } from 'zod';

const createOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
});

const processPaymentSchema = z.object({
  cardToken: z.string().min(1, 'Card token is required'),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  note: z.string().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

export class OrderController {
  constructor(private orderService: OrderService) {}

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
      const data = createOrderSchema.parse(req.body);

      const order = await this.orderService.createOrder({
        userId,
        authToken,
        shippingAddress: data.shippingAddress,
      });

      res.status(201).json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      const authToken = req.headers.authorization?.replace('Bearer ', '');
      const data = processPaymentSchema.parse(req.body);

      const order = await this.orderService.processPayment(orderId, data, authToken);

      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.orderId as string;

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

      const options: { page: number; limit: number; status?: string } = { page, limit };
      if (status) {
        options.status = status;
      }

      const { orders, total } = await this.orderService.listOrders(userId, options);

      res.json(successResponse(orders, paginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.orderId as string;
      const data = cancelOrderSchema.parse(req.body);

      const order = await this.orderService.cancelOrder(orderId, userId, data.reason);

      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoint
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      const data = updateStatusSchema.parse(req.body);

      const order = await this.orderService.updateStatus(orderId, data.status, data.note);

      res.json(successResponse(order));
    } catch (error) {
      next(error);
    }
  };
}
