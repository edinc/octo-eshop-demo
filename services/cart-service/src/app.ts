import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { cartRoutes } from './routes/cartRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Trust proxy for correct client IP behind nginx/load balancer
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check (before rate limiter)
app.get('/health', (_, res) => {
  res.json({ status: 'healthy', service: 'cart-service' });
});

// Rate limiting on API routes only
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }));

// Routes
app.use('/api/cart', cartRoutes);

// Error handling
app.use(errorHandler);

export default app;
