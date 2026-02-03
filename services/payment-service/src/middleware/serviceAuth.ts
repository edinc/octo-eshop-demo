import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@octo-eshop/utils';
import { config } from '../config';

export const authenticateService = (req: Request, res: Response, next: NextFunction): void => {
  const serviceAuthHeader = req.headers['x-service-auth'];

  if (serviceAuthHeader !== config.serviceAuthToken) {
    res.status(401).json(
      errorResponse({
        code: 'UNAUTHORIZED',
        message: 'Invalid service authentication',
      })
    );
    return;
  }

  next();
};
