import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';
import { errorResponse } from '@octo-eshop/utils';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json(
      errorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { errors: err.errors },
      })
    );
    return;
  }

  if (err instanceof AxiosError) {
    if (err.response?.status === 404) {
      res.status(404).json(
        errorResponse({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        })
      );
      return;
    }
  }

  if (err.message === 'Product not found') {
    res.status(404).json(
      errorResponse({
        code: 'PRODUCT_NOT_FOUND',
        message: err.message,
      })
    );
    return;
  }

  if (err.message === 'Item not found in cart') {
    res.status(404).json(
      errorResponse({
        code: 'ITEM_NOT_FOUND',
        message: err.message,
      })
    );
    return;
  }

  if (err.message === 'Insufficient stock') {
    res.status(400).json(
      errorResponse({
        code: 'INSUFFICIENT_STOCK',
        message: err.message,
      })
    );
    return;
  }

  res.status(500).json(
    errorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    })
  );
}
