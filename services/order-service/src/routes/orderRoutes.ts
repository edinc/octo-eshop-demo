import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { OrderService } from '../services/orderService';
import { OrderRepository } from '../repositories/orderRepository';
import { CartServiceClient } from '../clients/cartServiceClient';
import { PaymentServiceClient } from '../clients/paymentServiceClient';
import { ProductServiceClient } from '../clients/productServiceClient';
import { LocalEventPublisher } from '../events/publisher';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Initialize dependencies
const orderRepository = new OrderRepository();
const cartClient = new CartServiceClient();
const paymentClient = new PaymentServiceClient();
const productClient = new ProductServiceClient();
const eventPublisher = new LocalEventPublisher();

const orderService = new OrderService(
  orderRepository,
  cartClient,
  paymentClient,
  productClient,
  eventPublisher
);

const orderController = new OrderController(orderService);

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', orderController.createOrder);
router.get('/', orderController.listOrders);
router.get('/:orderId', orderController.getOrder);
router.post('/:orderId/pay', orderController.processPayment);
router.post('/:orderId/cancel', orderController.cancelOrder);

// Admin routes
router.put('/:orderId/status', requireAdmin, orderController.updateStatus);

export { router as orderRoutes };
