import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '@octo-eshop/utils';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(
      errorResponse({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      })
    );
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch {
    res.status(401).json(
      errorResponse({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      })
    );
  }
}
