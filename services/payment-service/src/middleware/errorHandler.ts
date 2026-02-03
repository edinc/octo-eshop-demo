import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '@octo-eshop/utils';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json(
      errorResponse({
        code: 'VALIDATION_ERROR',
        message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
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
