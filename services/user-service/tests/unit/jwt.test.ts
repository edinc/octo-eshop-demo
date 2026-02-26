import { describe, it, expect } from 'vitest';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt';

describe('jwt utils', () => {
  it('generates access and refresh tokens', () => {
    const tokens = generateTokens({ userId: 'user-1', email: 'user@example.com' });

    expect(tokens.accessToken).toBeTypeOf('string');
    expect(tokens.refreshToken).toBeTypeOf('string');
    expect(tokens.expiresIn).toBe(900);
  });

  it('verifies access tokens', () => {
    const { accessToken } = generateTokens({ userId: 'user-1', email: 'user@example.com' });
    const payload = verifyAccessToken(accessToken);

    expect(payload.userId).toBe('user-1');
    expect(payload.email).toBe('user@example.com');
  });

  it('rejects invalid or wrong-secret refresh token checks', () => {
    const { accessToken } = generateTokens({ userId: 'user-1', email: 'user@example.com' });

    expect(() => verifyRefreshToken(accessToken)).toThrow();
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
