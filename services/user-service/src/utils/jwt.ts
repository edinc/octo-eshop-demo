import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokens, JwtPayload } from '@octo-eshop/types';

interface TokenPayload {
  userId: string;
  email: string;
}

export function generateTokens(payload: TokenPayload): AuthTokens {
  const accessOptions: SignOptions = { expiresIn: config.jwt.accessExpiresIn };
  const refreshOptions: SignOptions = { expiresIn: config.jwt.refreshExpiresIn };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, accessOptions);
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, refreshOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}
