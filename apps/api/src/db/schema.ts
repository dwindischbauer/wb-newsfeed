import { pgTable, uuid, text, timestamp, varchar, integer, jsonb } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 255 }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  author: varchar('author', { length: 255 }),
  source: varchar('source', { length: 100 }).notNull().default('manual'),
  url: text('url'),
  publishedAt: timestamp('published_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const generationJobs = pgTable('generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, processing, completed, failed
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teasers = pgTable('teasers', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => generationJobs.id, { onDelete: 'set null' }),
  headline: text('headline').notNull(),
  summary: text('summary').notNull(),
  keyTakeaways: jsonb('key_takeaways').$type<string[]>(),
  sentiment: varchar('sentiment', { length: 50 }),
  language: varchar('language', { length: 10 }).default('de'),
  modelUsed: varchar('model_used', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const logs = pgTable('logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => generationJobs.id, { onDelete: 'cascade' }),
  level: varchar('level', { length: 20 }).notNull().default('info'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
