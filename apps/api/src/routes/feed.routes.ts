import { FastifyInstance } from 'fastify';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { articles, teasers, generationJobs, logs } from '../db/schema.js';

export async function feedRoutes(fastify: FastifyInstance) {
  // Mobile Newsfeed endpoint - strictly returns ONLY published articles ('Veröffentlicht')
  fastify.get('/api/feed', async () => {
    const items = await db
      .select({
        teaserId: teasers.id,
        articleId: articles.id,
        headline: teasers.headline,
        summary: teasers.summary,
        keyTakeaways: teasers.keyTakeaways,
        sentiment: teasers.sentiment,
        modelUsed: teasers.modelUsed,
        status: articles.status,
        publishedAt: articles.publishedAt,
        author: articles.author,
        source: articles.source,
        articleTitle: articles.title,
        content: articles.content,
      })
      .from(teasers)
      .innerJoin(articles, eq(teasers.articleId, articles.id))
      .where(eq(articles.status, 'Veröffentlicht'))
      .orderBy(desc(teasers.createdAt))
      .limit(50);

    return {
      count: items.length,
      feed: items,
    };
  });

  // Admin CMS article list endpoint - returns all articles with their live status
  fastify.get('/api/articles', async () => {
    const articleList = await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        status: articles.status,
        author: articles.author,
        source: articles.source,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .orderBy(desc(articles.createdAt))
      .limit(100);

    return { articles: articleList };
  });

  fastify.get('/api/jobs', async () => {
    const jobList = await db
      .select({
        id: generationJobs.id,
        articleId: generationJobs.articleId,
        articleTitle: articles.title,
        status: generationJobs.status,
        attempts: generationJobs.attempts,
        error: generationJobs.error,
        createdAt: generationJobs.createdAt,
        updatedAt: generationJobs.updatedAt,
      })
      .from(generationJobs)
      .innerJoin(articles, eq(generationJobs.articleId, articles.id))
      .orderBy(desc(generationJobs.createdAt))
      .limit(100);

    return { jobs: jobList };
  });

  fastify.get('/api/logs', async () => {
    const logList = await db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(100);

    return { logs: logList };
  });
}
