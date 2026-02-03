import express from 'express';
import { orderRoutes } from './routes/orderRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

// Routes
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

export { app };
