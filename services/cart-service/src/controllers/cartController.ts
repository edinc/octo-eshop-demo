import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { successResponse } from '@octo-eshop/utils';
import { z } from 'zod';

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export class CartController {
  constructor(private cartService: CartService) {}

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const cart = await this.cartService.getCart(userId);
      const total = await this.cartService.getCartTotal(userId);
      res.json(successResponse({ ...cart, total }));
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { productId, quantity } = addItemSchema.parse(req.body);
      const cart = await this.cartService.addItem(userId, productId, quantity);
      res.status(201).json(successResponse(cart));
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const productId = req.params['productId'];
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const { quantity } = updateItemSchema.parse(req.body);
      const cart = await this.cartService.updateItem(userId, productId, quantity);
      res.json(successResponse(cart));
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const productId = req.params['productId'];
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const cart = await this.cartService.removeItem(userId, productId);
      res.json(successResponse(cart));
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      await this.cartService.clearCart(userId);
      res.json(successResponse({ message: 'Cart cleared' }));
    } catch (error) {
      next(error);
    }
  };
}
