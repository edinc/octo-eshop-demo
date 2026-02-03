import express from 'express';
import { paymentRoutes } from './routes/paymentRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

// Routes
app.use('/api/payments', paymentRoutes);

// Error handling
app.use(errorHandler);

export { app };
