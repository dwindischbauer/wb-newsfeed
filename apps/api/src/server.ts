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
    await server.listen({ port: 3005, host: '0.0.0.0' });
    console.log(`Server listening on port 3005`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
