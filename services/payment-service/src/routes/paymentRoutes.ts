import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { PaymentService } from '../services/paymentService';
import { authenticateService } from '../middleware/serviceAuth';

const router = Router();
const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

// Service-to-service authentication (internal API)
router.use(authenticateService);

router.post('/', paymentController.processPayment);
router.get('/:id', paymentController.getPayment);
router.post('/:id/refund', paymentController.refundByPaymentId);
router.post('/order/:orderId/refund', paymentController.refundByOrderId);

export { router as paymentRoutes };
