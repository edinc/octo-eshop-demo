import { app } from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Payment service running on port ${config.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Payment service shut down');
  });
});
