import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripHtml } from '../utils/format';

export default async function (server: FastifyInstance) {
  server.get('/api/articles', async (request, reply) => {
    const allArticles = await db.select().from(articles).orderBy(desc(articles.createdAt));
    return allArticles.map(a => ({ ...a, content: stripHtml(a.content) }));
  });

  server.get('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const article = await db.select().from(articles).where(eq(articles.id, parseInt(id)));
    if (article.length === 0) {
      reply.status(404).send({ error: 'Article not found' });
      return;
    }
    return article[0];
  });

  server.put('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    
    if (body.status) {
      const existing = await db.select().from(articles).where(eq(articles.id, parseInt(id)));
      if (existing.length === 0) {
        reply.status(404);
        return { success: false, error: 'Article not found' };
      }
      await db.update(articles).set({ status: body.status }).where(eq(articles.id, parseInt(id)));
    }
    
    return { success: true };
  });

  server.delete('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await db.delete(articles).where(eq(articles.id, parseInt(id)));
    
    return { success: true };
  });

  server.post('/api/articles', async (request, reply) => {
    const body = request.body as any;
    
    if (!body.title || !body.content || body.content.length < 10) {
      reply.status(400);
      return { success: false, error: 'Titel und Content (min 10 Zeichen) werden benötigt' };
    }

    const cleanContent = stripHtml(body.content);

    const newArticle = await db.insert(articles).values({
      title: body.title,
      content: cleanContent,
      author: body.author || 'Unbekannt',
      category: body.category || 'Allgemein',
      status: body.status || 'draft'
    }).returning();
    return newArticle[0];
  });
}
