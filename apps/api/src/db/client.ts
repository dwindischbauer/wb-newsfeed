import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.config.js';
import { logger } from '../services/logger.service.js';

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: (notice) => logger.debug(notice, 'Postgres notice'),
});

export const db = drizzle(queryClient);
export { queryClient };
