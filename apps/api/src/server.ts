import Fastify from 'fastify';
import jobRoutes from './routes/jobs';
import articleRoutes from './routes/articles';
import './queue'; // Initialize worker

import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import * as path from 'path';
import * as fs from 'fs';

const server = Fastify({
  logger: true
});

server.register(cors, {
  origin: '*'
});

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

server.register(fastifyStatic, {
  root: publicDir,
  prefix: '/'
});

server.register(articleRoutes);
server.register(jobRoutes);
server.register(require('./routes/feed').default);
server.register(require('./routes/settings').default);

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
