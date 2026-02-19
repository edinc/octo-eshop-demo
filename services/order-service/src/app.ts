import express from 'express';
import rateLimit from 'express-rate-limit';
import { orderRoutes } from './routes/orderRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// Routes
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

export { app };
