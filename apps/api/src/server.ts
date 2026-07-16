import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { logger } from './services/logger.service.js';
import { healthRoutes } from './routes/health.routes.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: false,
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(sensible);

  // Register routes
  await fastify.register(healthRoutes);

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    logger.info(`Server listening at http://${host}:${port}`);
  } catch (err) {
    logger.error(err, 'Error starting server');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
