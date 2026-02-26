import { describe, it, expect, vi } from 'vitest';
import { ZodError } from 'zod';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('product-service errorHandler', () => {
  it('returns 400 for zod validation errors', () => {
    const err = new ZodError([{ code: 'custom', path: ['id'], message: 'Required' } as any]);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 for product not found errors', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(new Error('Product not found'), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      })
    );
  });
});
