import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, queryClient } from './client.js';
import { logger } from '../services/logger.service.js';

export async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error(error, 'Failed to run database migrations');
    throw error;
  }
}

if (process.argv[1]?.includes('migrate.ts')) {
  runMigrations()
    .then(() => queryClient.end())
    .catch(() => process.exit(1));
}
