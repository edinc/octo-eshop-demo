import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-dev',
  },
};
