import { pgTable, serial, text, timestamp, boolean, integer, varchar } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  teaser: text('teaser'),
  keyTakeaways: text('key_takeaways'),
  imageUrl: text('image_url'),
  category: text('category').notNull(),
  author: text('author').notNull().default('ORF.at Redaktion'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id').references(() => articles.id),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  result: text('result'),
  error: text('error'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
