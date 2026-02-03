export const config = {
  port: parseInt(process.env.PORT || '3004', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/orderdb',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  cartServiceUrl: process.env.CART_SERVICE_URL || 'http://localhost:3003',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  serviceAuthToken: process.env.SERVICE_AUTH_TOKEN || 'internal-service-token',
};
