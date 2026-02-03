import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { cartRoutes } from './routes/cartRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'healthy', service: 'cart-service' });
});

// Routes
app.use('/api/cart', cartRoutes);

// Error handling
app.use(errorHandler);

export default app;
