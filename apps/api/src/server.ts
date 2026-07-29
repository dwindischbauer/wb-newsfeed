import Fastify from 'fastify';
import articleRoutes from './routes/articles';
import jobRoutes from './routes/jobs';
import './queue'; // Initialize worker

const server = Fastify({
  logger: true
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
