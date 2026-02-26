import { describe, it, expect, vi } from 'vitest';
import { ZodError } from 'zod';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('order-service errorHandler', () => {
  it('returns 400 for zod validation errors', () => {
    const err = new ZodError([{ code: 'custom', path: ['status'], message: 'Required' } as any]);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('maps known errors to expected status and error code', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(new Error('Order not found'), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'ORDER_NOT_FOUND' }),
      })
    );
  });
});
