import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, jobs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripHtml } from '@wb-news/shortform-news';
import { generationQueue } from '../queue';

export default async function (server: FastifyInstance) {
  server.get('/api/articles', async (request, reply) => {
    const allArticles = await db.select().from(articles).orderBy(desc(articles.createdAt));
    return allArticles.map(a => ({ ...a, content: stripHtml(a.content) }));
  });

  server.get('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    const article = await db.select().from(articles).where(eq(articles.id, parsedId));
    if (article.length === 0) {
      reply.status(404).send({ error: 'Article not found' });
      return;
    }
    return article[0];
  });

  server.put('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    
    if (body.status) {
      const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
      if (existing.length === 0) {
        reply.status(404);
        return { success: false, error: 'Article not found' };
      }
      await db.update(articles).set({ status: body.status }).where(eq(articles.id, parsedId));
    }
    
    return { success: true };
  });

  server.delete('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    
    await db.delete(articles).where(eq(articles.id, parsedId));
    
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

  server.post('/api/articles/quick', async (request, reply) => {
    const body = request.body as any;
    const text = body.text || body.content;
    
    if (!text || text.length < 10) {
      reply.status(400);
      return { success: false, error: 'Text min 10 Zeichen wird benötigt' };
    }

    const cleanContent = stripHtml(text);
    const generatedTitle = cleanContent.substring(0, 30) + '...';

    const newArticle = await db.insert(articles).values({
      title: generatedTitle,
      content: cleanContent,
      author: 'Quick API',
      category: 'Allgemein',
      status: 'published'
    }).returning();
    
    const articleId = newArticle[0].id;
    
    // Create job record in db first to get the auto-increment ID
    const newJob = await db.insert(jobs).values({
      articleId,
      type: 'teaser_generation',
      status: 'pending'
    }).returning();
    
    const dbJobId = newJob[0].id;
    
    // Automatically queue generation job
    const job = await generationQueue.add('teaser_generation', {
      articleId,
      jobId: dbJobId,
      type: 'teaser_generation'
    }, { jobId: dbJobId.toString() });
    
    return { success: true, article: newArticle[0], jobId: job.id };
  });
}
