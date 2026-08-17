import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set, falling back to default localhost connection string.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://wb_user:wb_password@localhost:5433/wb_newsfeed'
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
