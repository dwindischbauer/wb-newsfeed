import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, jobs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripHtml } from '../utils/format';
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
    
    const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
    if (existing.length === 0) {
      reply.status(404);
      return { success: false, error: 'Article not found' };
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.teaser !== undefined) updateData.teaser = body.teaser;
    if (body.keyTakeaways !== undefined) updateData.keyTakeaways = body.keyTakeaways;
    if (body.author !== undefined) updateData.author = body.author;
    
    if (Object.keys(updateData).length > 0) {
      await db.update(articles).set(updateData).where(eq(articles.id, parsedId));
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

  server.post('/api/articles/:id/image', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }

    const data = await request.file();
    if (!data) {
      reply.status(400).send({ error: 'No file uploaded' });
      return;
    }

    if (!data.mimetype.startsWith('image/')) {
      reply.status(400).send({ error: 'Only images are allowed' });
      return;
    }

    const { pipeline } = await import('stream/promises');
    const fs = await import('fs');
    const path = await import('path');
    
    const ext = path.extname(data.filename) || '.jpg';
    const filename = `article_${parsedId}_${Date.now()}${ext}`;
    const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
    const filepath = path.join(IMAGES_DIR, filename);

    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    await pipeline(data.file, fs.createWriteStream(filepath));
    const imageUrl = `/images/${filename}`;

    await db.update(articles).set({ imageUrl }).where(eq(articles.id, parsedId));

    return { success: true, imageUrl };
  });

  server.delete('/api/articles/:id/image', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    
    await db.update(articles).set({ imageUrl: null }).where(eq(articles.id, parsedId));
    return { success: true };
  });

  server.post('/api/articles', async (request, reply) => {
    const body = request.body as any;
    
    if (!body.content || body.content.length < 10) {
      reply.status(400);
      return { success: false, error: 'Content (min 10 Zeichen) wird benötigt' };
    }

    const cleanContent = stripHtml(body.content);
    const finalTitle = body.title ? body.title : '[Auto-Titel ausstehend]';

    const newArticle = await db.insert(articles).values({
      title: finalTitle,
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
    let jobIdStr = `job-${dbJobId}`;
    try {
      const job = await generationQueue.add('teaser_generation', {
        articleId,
        jobId: dbJobId,
        type: 'teaser_generation'
      }, { jobId: jobIdStr });
      
      return { success: true, article: newArticle[0], jobId: job.id };
    } catch (error) {
      await db.update(jobs).set({ status: 'failed', error: String(error) }).where(eq(jobs.id, dbJobId));
      return { success: false, article: newArticle[0], jobId: jobIdStr, error: 'Job enqueuing failed' };
    }
  });
}
