import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { CartService } from '../services/cartService';
import { authenticate } from '../middleware/auth';
import Redis from 'ioredis';
import { config } from '../config';

const router = Router();
const redis = new Redis(config.redisUrl);
const cartService = new CartService(redis, config.productServiceUrl);
const cartController = new CartController(cartService);

// All cart routes require authentication
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:productId', cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

export { router as cartRoutes };
