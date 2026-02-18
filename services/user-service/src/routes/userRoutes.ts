import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '.prisma/client-user';

const router = Router();
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/refresh', userController.refreshToken);

// Protected routes
router.post('/logout', authenticate, userController.logout);
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);

export { router as userRoutes };
