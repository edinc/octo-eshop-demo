import { describe, it, expect, vi } from 'vitest';
import { ZodError } from 'zod';
import { errorHandler } from '../../src/middleware/errorHandler';

describe('user-service errorHandler', () => {
  it('returns validation response for zod errors', () => {
    const err = new ZodError([
      { code: 'custom', path: ['email'], message: 'Invalid email' } as any,
    ]);
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(err, {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });

  it('maps known user-not-found errors to 404', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(new Error('User not found'), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      })
    );
  });

  it('falls back to 500 for unknown errors', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

    errorHandler(new Error('something unexpected'), {} as any, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
      })
    );
  });
});
