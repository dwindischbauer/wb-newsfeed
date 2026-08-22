import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:adminpassword@localhost:5433/wbnews'
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
