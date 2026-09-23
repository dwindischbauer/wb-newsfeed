import { pgTable, serial, text, timestamp, boolean, integer, varchar, doublePrecision, unique } from 'drizzle-orm/pg-core';

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

// Every generated (or manually edited) teaser is kept as an immutable version,
// together with the model and sampling parameters that produced it, so older
// results can be compared, reproduced and restored.
export const generationVersions = pgTable('generation_versions', {
  id: serial('id').primaryKey(),
  articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: text('title'),
  category: text('category'),
  teaser: text('teaser'),
  keyTakeaways: text('key_takeaways'),
  tags: text('tags'),
  source: varchar('source', { length: 20 }).notNull(),
  model: varchar('model', { length: 100 }),
  temperature: doublePrecision('temperature'),
  seed: integer('seed'),
  contentHash: varchar('content_hash', { length: 64 }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  restoredFrom: integer('restored_from'),
  createdAt: timestamp('created_at').defaultNow()
}, (t) => [unique('generation_versions_article_version').on(t.articleId, t.version)]);
