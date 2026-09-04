import Fastify from 'fastify';
import jobRoutes from './routes/jobs';
import articleRoutes from './routes/articles';
import './queue'; // Initialize worker

import cors from '@fastify/cors';

const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: '*'
});

server.register(articleRoutes);
server.register(jobRoutes);

server.get('/api/sysinfo', async (request, reply) => {
  return {
    status: 'ok',
    service: 'wb-news-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err, 'Failed to start API server');
    process.exit(1);
  }
};

start();
