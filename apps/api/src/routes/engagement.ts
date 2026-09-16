import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, comments } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  // --- Likes ---
  server.post('/api/articles/:id/like', async (request, reply) => {
    const id = parseInt((request.params as { id: string }).id, 10);
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
    const id = parseInt((request.params as { id: string }).id, 10);
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

  // --- Shares ---
  server.post('/api/articles/:id/share', async (request, reply) => {
    const id = parseInt((request.params as { id: string }).id, 10);
    if (Number.isNaN(id)) {
      reply.status(400);
      return { success: false, error: 'Invalid article ID' };
    }
    const updated = await db.update(articles)
      .set({ shareCount: sql`${articles.shareCount} + 1` })
      .where(eq(articles.id, id))
      .returning({ shareCount: articles.shareCount });

    if (updated.length === 0) {
      reply.status(404);
      return { success: false, error: 'Article not found' };
    }
    return { success: true, shareCount: updated[0].shareCount };
  });

  // --- Comments ---
  server.get('/api/articles/:id/comments', async (request, reply) => {
    const id = parseInt((request.params as { id: string }).id, 10);
    if (Number.isNaN(id)) {
      reply.status(400);
      return { success: false, error: 'Invalid article ID' };
    }
    const list = await db.select().from(comments)
      .where(eq(comments.articleId, id))
      .orderBy(desc(comments.createdAt));
    return list;
  });

  server.post('/api/articles/:id/comments', async (request, reply) => {
    const id = parseInt((request.params as { id: string }).id, 10);
    if (Number.isNaN(id)) {
      reply.status(400);
      return { success: false, error: 'Invalid article ID' };
    }
    const body = (request.body as { text?: string; authorName?: string }) || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text || text.length < 1 || text.length > 1000) {
      reply.status(400);
      return { success: false, error: 'Kommentartext (1-1000 Zeichen) wird benötigt' };
    }
    const authorName = (typeof body.authorName === 'string' && body.authorName.trim())
      ? body.authorName.trim().slice(0, 60)
      : 'Anonym';

    const articleExists = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, id));
    if (articleExists.length === 0) {
      reply.status(404);
      return { success: false, error: 'Article not found' };
    }

    const inserted = await db.insert(comments).values({ articleId: id, authorName, text }).returning();
    await db.update(articles)
      .set({ commentCount: sql`${articles.commentCount} + 1` })
      .where(eq(articles.id, id));

    return { success: true, comment: inserted[0] };
  });
}
