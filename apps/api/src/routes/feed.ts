import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  server.get('/api/feed', async (request, reply) => {
    const publishedArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.createdAt));
      
    return publishedArticles;
  });
}
