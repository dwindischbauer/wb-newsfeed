import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  teaser: text('teaser'),
  keyTakeaways: text('key_takeaways'),
  category: text('category').notNull(),
  author: text('author').notNull().default('ORF.at Redaktion'),
  status: text('status').notNull().default('draft'), // draft, published
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  articleId: serial('article_id').references(() => articles.id),
  type: text('type').notNull(), // e.g., teaser_generation
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  result: text('result'),
  error: text('error'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
