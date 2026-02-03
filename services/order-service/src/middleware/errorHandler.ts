import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '@octo-eshop/utils';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json(
      errorResponse({
        code: 'VALIDATION_ERROR',
        message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      })
    );
    return;
  }

  // Known application errors
  const knownErrors: Record<string, number> = {
    'Cart is empty': 400,
    'Order not found': 404,
    'Order cannot be paid': 400,
    'Order cannot be cancelled': 400,
    'Payment failed': 400,
    Unauthorized: 403,
  };

  for (const [message, status] of Object.entries(knownErrors)) {
    if (err.message.includes(message)) {
      res.status(status).json(
        errorResponse({
          code: message.toUpperCase().replace(/ /g, '_'),
          message: err.message,
        })
      );
      return;
    }
  }

  // Stock validation errors
  if (err.message.includes('Insufficient stock')) {
    res.status(400).json(
      errorResponse({
        code: 'INSUFFICIENT_STOCK',
        message: err.message,
      })
    );
    return;
  }

  // Status transition errors
  if (err.message.includes('Cannot transition')) {
    res.status(400).json(
      errorResponse({
        code: 'INVALID_STATUS_TRANSITION',
        message: err.message,
      })
    );
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json(
    errorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  );
};
