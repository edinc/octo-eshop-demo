import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { ProductService } from '../services/productService';
import { ProductRepository } from '../repositories/productRepository';
import { PrismaClient } from '.prisma/client-product';

const router = Router();
const prisma = new PrismaClient();
const productRepository = new ProductRepository(prisma);
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

// Public routes
router.get('/', productController.list);
router.get('/search', productController.search);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getById);

// Admin routes (would typically have auth middleware)
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

export { router as productRoutes };
