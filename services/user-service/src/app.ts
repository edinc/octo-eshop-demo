import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { userRoutes } from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes);

// Error handling
app.use(errorHandler);

export default app;
