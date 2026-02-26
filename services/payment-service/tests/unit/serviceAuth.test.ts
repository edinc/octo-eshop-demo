import { describe, it, expect, vi } from 'vitest';
import { authenticateService } from '../../src/middleware/serviceAuth';
import { config } from '../../src/config';

describe('payment-service authenticateService middleware', () => {
  it('returns 401 for invalid service token', () => {
    const req = { headers: { 'x-service-auth': 'wrong-token' } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    authenticateService(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for valid service token', () => {
    const req = { headers: { 'x-service-auth': config.serviceAuthToken } } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    authenticateService(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
