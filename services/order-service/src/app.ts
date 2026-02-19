import express from 'express';
import rateLimit from 'express-rate-limit';
import { orderRoutes } from './routes/orderRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Trust proxy for correct client IP behind nginx/load balancer
app.set('trust proxy', 1);

app.use(express.json());

// Health check (before rate limiter)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true });

// Rate limiting on API routes only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use('/api', apiLimiter as any);

// Routes
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

export { app };
