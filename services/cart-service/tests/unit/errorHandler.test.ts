import { describe, it, expect, vi } from 'vitest';
import { ZodError } from 'zod';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('cart-service errorHandler', () => {
  it('returns 400 for zod validation errors', () => {
    const err = new ZodError([
      { code: 'custom', path: ['quantity'], message: 'Invalid quantity' } as any,
    ]);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for insufficient stock error', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(new Error('Insufficient stock'), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INSUFFICIENT_STOCK' }),
      })
    );
  });
});
