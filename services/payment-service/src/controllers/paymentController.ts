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
        res.json(
          successResponse({
            transactionId: result.transactionId,
            status: 'completed',
          })
        );
      } else {
        res.status(400).json(
          errorResponse({
            code: 'PAYMENT_FAILED',
            message: result.error || 'Payment failed',
          })
        );
      }
    } catch (error) {
      next(error);
    }
  };

  getPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const payment = await this.paymentService.getPayment(id);

      if (!payment) {
        res.status(404).json(
          errorResponse({
            code: 'NOT_FOUND',
            message: 'Payment not found',
          })
        );
        return;
      }

      res.json(successResponse(payment));
    } catch (error) {
      next(error);
    }
  };

  // Refund by payment ID
  refundByPaymentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentId = req.params.id as string;
      refundSchema.parse(req.body);

      const result = await this.paymentService.refund({ paymentId });

      if (result.success) {
        res.json(
          successResponse({
            transactionId: result.transactionId,
            status: 'refunded',
          })
        );
      } else {
        res.status(400).json(
          errorResponse({
            code: 'REFUND_FAILED',
            message: result.error || 'Refund failed',
          })
        );
      }
    } catch (error) {
      next(error);
    }
  };

  // Refund by order ID (convenience endpoint for order-service)
  refundByOrderId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      refundSchema.parse(req.body);

      const result = await this.paymentService.refundByOrderId(orderId);

      if (result.success) {
        res.json(
          successResponse({
            transactionId: result.transactionId,
            status: 'refunded',
          })
        );
      } else {
        res.status(400).json(
          errorResponse({
            code: 'REFUND_FAILED',
            message: result.error || 'Refund failed',
          })
        );
      }
    } catch (error) {
      next(error);
    }
  };
}
