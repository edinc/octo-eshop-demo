import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
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

  if (err.message === 'User already exists') {
    res.status(409).json(
      errorResponse({
        code: 'USER_EXISTS',
        message: err.message,
      })
    );
    return;
  }

  if (err.message === 'Invalid credentials') {
    res.status(401).json(
      errorResponse({
        code: 'INVALID_CREDENTIALS',
        message: err.message,
      })
    );
    return;
  }

  if (err.message === 'User not found') {
    res.status(404).json(
      errorResponse({
        code: 'NOT_FOUND',
        message: err.message,
      })
    );
    return;
  }

  if (err.message === 'Invalid refresh token') {
    res.status(401).json(
      errorResponse({
        code: 'INVALID_TOKEN',
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
