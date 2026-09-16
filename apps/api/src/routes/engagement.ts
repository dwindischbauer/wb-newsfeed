import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  // --- Likes ---
  server.post('/api/articles/:id/like', async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (Number.isNaN(id)) {
      reply.status(400);
      return { success: false, error: 'Invalid article ID' };
    }
    const updated = await db.update(articles)
      .set({ likeCount: sql`${articles.likeCount} + 1` })
      .where(eq(articles.id, id))
      .returning({ likeCount: articles.likeCount });

    if (updated.length === 0) {
      reply.status(404);
      return { success: false, error: 'Article not found' };
    }
    return { success: true, likeCount: updated[0].likeCount };
  });

  server.post('/api/articles/:id/unlike', async (request, reply) => {
    const id = parseInt((request.params as any).id, 10);
    if (Number.isNaN(id)) {
      reply.status(400);
      return { success: false, error: 'Invalid article ID' };
    }
    const updated = await db.update(articles)
      .set({ likeCount: sql`GREATEST(${articles.likeCount} - 1, 0)` })
      .where(eq(articles.id, id))
      .returning({ likeCount: articles.likeCount });

    if (updated.length === 0) {
      reply.status(404);
      return { success: false, error: 'Article not found' };
    }
    return { success: true, likeCount: updated[0].likeCount };
  });
}
