import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { env } from './config/env.config.js';
import { logger } from './services/logger.service.js';
import { setupErrorHandler } from './plugins/errorHandler.js';
import { healthRoutes } from './routes/health.routes.js';
import { articleRoutes } from './routes/article.routes.js';
import { feedRoutes } from './routes/feed.routes.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: false,
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(sensible);

  setupErrorHandler(fastify);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(articleRoutes);
  await fastify.register(feedRoutes);

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: env.PORT, host: env.HOST });
    logger.info(`Server listening at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.error(err, 'Error starting server');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
