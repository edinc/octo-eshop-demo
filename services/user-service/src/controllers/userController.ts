import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { successResponse } from '@octo-eshop/utils';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export class UserController {
  constructor(private userService: UserService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await this.userService.register(data);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      const tokens = await this.userService.login(data.email, data.password);
      res.json(successResponse(tokens));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      await this.userService.logout(refreshToken);
      res.json(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.getProfile(userId);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const parsed = updateProfileSchema.parse(req.body);
      const data: { firstName?: string; lastName?: string } = {};
      if (parsed.firstName !== undefined) data.firstName = parsed.firstName;
      if (parsed.lastName !== undefined) data.lastName = parsed.lastName;
      const user = await this.userService.updateProfile(userId, data);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await this.userService.refreshToken(refreshToken);
      res.json(successResponse(tokens));
    } catch (error) {
      next(error);
    }
  };
}
