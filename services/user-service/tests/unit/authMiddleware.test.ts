import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../../src/middleware/auth';
import { verifyAccessToken } from '../../src/utils/jwt';

vi.mock('../../src/utils/jwt', () => ({
  verifyAccessToken: vi.fn(),
}));

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', () => {
    const req = { headers: {} } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('invalid');
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ message: 'Invalid or expired token' }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('injects req.user and calls next for valid token', () => {
    const req = { headers: { authorization: 'Bearer valid-token' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();
    vi.mocked(verifyAccessToken).mockReturnValue({
      userId: 'user-1',
      email: 'test@example.com',
    } as any);

    authenticate(req, res, next);

    expect(req.user).toEqual({ userId: 'user-1', email: 'test@example.com' });
    expect(next).toHaveBeenCalledOnce();
  });
});
