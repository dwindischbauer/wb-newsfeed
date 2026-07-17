import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),

  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5433),
  POSTGRES_USER: z.string().default('wb_user'),
  POSTGRES_PASSWORD: z.string().default('wb_password'),
  POSTGRES_DB: z.string().default('wb_newsfeed'),
  DATABASE_URL: z.string().optional(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:3b-instruct'),
  LLM_TIMEOUT_MS: z.coerce.number().default(30000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = {
  ...parsed.data,
  DATABASE_URL:
    parsed.data.DATABASE_URL ||
    `postgres://${parsed.data.POSTGRES_USER}:${parsed.data.POSTGRES_PASSWORD}@${parsed.data.POSTGRES_HOST}:${parsed.data.POSTGRES_PORT}/${parsed.data.POSTGRES_DB}`,
};
