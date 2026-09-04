import { pgTable, serial, text, timestamp, integer, varchar } from 'drizzle-orm/pg-core';

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
  likeCount: integer('like_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  shareCount: integer('share_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  result: text('result'),
  error: text('error'),
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  color: varchar('color', { length: 20 }).default('#6f8f1a'),
  createdAt: timestamp('created_at').defaultNow()
});

export const articleTags = pgTable('article_tags', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  authorName: varchar('author_name', { length: 60 }).notNull().default('Anonym'),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  articleId: integer('article_id').references(() => articles.id, { onDelete: 'cascade' }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow()
});


