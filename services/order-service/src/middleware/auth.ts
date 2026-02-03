import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '@octo-eshop/utils';
import { config } from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
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
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json(
      errorResponse({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      })
    );
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json(
      errorResponse({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      })
    );
    return;
  }
  next();
};
