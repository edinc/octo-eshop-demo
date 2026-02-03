export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  serviceAuthToken: process.env.SERVICE_AUTH_TOKEN || 'internal-service-token',
};
