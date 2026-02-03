import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { productRoutes } from './routes/productRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'healthy', service: 'product-service' });
});

// Routes
app.use('/api/products', productRoutes);

// Error handling
app.use(errorHandler);

export default app;
