import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { jobs, articles } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { inMemoryArticles } from './articles';
import { autoExtractArticleMetadata } from '../utils/metadata';
import { generateArticleImage } from '../services/imageGenerator';

export const inMemoryJobs: Map<number, any> = new Map();
let jobCounter = 100;

export async function executeDirectJob(jobId: number, articleId: number, type: string) {
  const startTime = Date.now();
  const updateJob = async (fields: any) => {
    try {
      await db.update(jobs).set(fields).where(eq(jobs.id, jobId));
    } catch {}
    const mem = inMemoryJobs.get(jobId);
    if (mem) {
      inMemoryJobs.set(jobId, { ...mem, ...fields, updatedAt: new Date() });
    }
  };

  await updateJob({ status: 'processing' });

  try {
    let article: any = null;
    try {
      const dbRes = await db.select().from(articles).where(eq(articles.id, articleId));
      if (dbRes.length > 0) article = dbRes[0];
    } catch {}
    if (!article) {
      article = inMemoryArticles.get(articleId);
    }
    if (!article) {
      throw new Error('Article not found');
    }

    if (type === 'teaser_generation' || type === 'full_generation') {
      const meta = autoExtractArticleMetadata(article.content, article.category);
      const newTitle = (!article.title || article.title === '[Auto-Titel ausstehend]') ? meta.title : article.title;
      const newCategory = (!article.category || article.category === 'Auto' || article.category === 'Allgemein') ? meta.category : article.category;
      
      const updateData: any = {
        title: newTitle,
        category: newCategory,
        teaser: meta.teaser,
        keyTakeaways: meta.keyTakeaways
      };

      try {
        await db.update(articles).set(updateData).where(eq(articles.id, articleId));
      } catch {}

      const mem = inMemoryArticles.get(articleId);
      if (mem) {
        const mergedTags = (mem.tags && mem.tags.length > 0) ? mem.tags : meta.tags;
        inMemoryArticles.set(articleId, { ...mem, ...updateData, tags: mergedTags, updatedAt: new Date() });
      }
    }

    if (type === 'image_generation' || type === 'full_generation') {
      const tagsList = (article.tags || []).map((t: any) => typeof t === 'string' ? t : t.name);
      const imgUrl = await generateArticleImage(
        article.title,
        article.category,
        article.id,
        article.teaser,
        tagsList
      );
      if (imgUrl) {
        try {
          await db.update(articles).set({ imageUrl: imgUrl }).where(eq(articles.id, articleId));
        } catch {}
        const mem = inMemoryArticles.get(articleId);
        if (mem) {
          inMemoryArticles.set(articleId, { ...mem, imageUrl: imgUrl, updatedAt: new Date() });
        }
      }
    }

    await updateJob({
      status: 'completed',
      result: type === 'image_generation' ? 'KI-Bild generiert' : 'Erfolgreich generiert',
      processingTimeMs: Date.now() - startTime
    });
  } catch (err: any) {
    await updateJob({
      status: 'failed',
      error: err.message,
      processingTimeMs: Date.now() - startTime
    });
  }
}

export default async function (server: FastifyInstance) {
  server.get('/api/jobs', async (request, reply) => {
    const { status } = request.query as { status?: string };
    
    let list: any[] = [];
    try {
      if (status) {
        list = await db.select().from(jobs).where(eq(jobs.status, status)).orderBy(desc(jobs.createdAt));
      } else {
        list = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
      }
      for (const j of list) {
        inMemoryJobs.set(j.id, j);
      }
    } catch {
      list = Array.from(inMemoryJobs.values());
      if (status) list = list.filter(j => j.status === status);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return list.map(j => ({ ...j, jobId: j.id }));
  });

  server.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid job ID' });
      return;
    }

    try {
      const jobRes = await db.select().from(jobs).where(eq(jobs.id, parsedId));
      if (jobRes.length > 0) {
        inMemoryJobs.set(parsedId, jobRes[0]);
        return { ...jobRes[0], jobId: jobRes[0].id };
      }
    } catch {}

    const mem = inMemoryJobs.get(parsedId);
    if (mem) {
      return { ...mem, jobId: mem.id };
    }

    reply.status(404).send({ error: 'Job not found' });
  });

  server.post('/api/jobs/:id/retry', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid job ID' });
      return;
    }
    
    let jobRecord: any = null;
    try {
      const res = await db.select().from(jobs).where(eq(jobs.id, parsedId));
      if (res.length > 0) jobRecord = res[0];
    } catch {}

    if (!jobRecord) {
      jobRecord = inMemoryJobs.get(parsedId);
    }

    if (!jobRecord) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    setImmediate(() => {
      executeDirectJob(parsedId, jobRecord.articleId, jobRecord.type);
    });

    return { success: true };
  });

  server.post('/api/jobs', async (request, reply) => {
    const body = request.body as { articleId?: number, type?: string };
    
    if (!body.articleId || !body.type) {
      reply.status(400);
      return { success: false, error: 'Missing articleId or type' };
    }

    let jobRecord: any = null;
    try {
      const newJob = await db.insert(jobs).values({
        articleId: body.articleId,
        type: body.type,
        status: 'pending'
      }).returning();
      jobRecord = newJob[0];
    } catch (e) {
      jobCounter++;
      jobRecord = {
        id: jobCounter,
        articleId: body.articleId,
        type: body.type,
        status: 'pending',
        result: null,
        error: null,
        processingTimeMs: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    inMemoryJobs.set(jobRecord.id, jobRecord);

    let queuedToRedis = false;
    try {
      const { generationQueue } = await import('../queue');
      await generationQueue.add(body.type, { jobId: jobRecord.id, articleId: body.articleId }, { 
        jobId: `job-${jobRecord.id}`,
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });
      queuedToRedis = true;
    } catch (err) {
      // Redis offline: direct execution fallback
    }

    if (!queuedToRedis) {
      setImmediate(() => {
        executeDirectJob(jobRecord.id, body.articleId!, body.type!);
      });
    }

    return {
      ...jobRecord,
      jobId: jobRecord.id
    };
  });

  server.delete('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid job ID' });
      return;
    }
    
    try {
      const { generationQueue } = await import('../queue');
      const job = await generationQueue.getJob(`job-${id}`);
      if (job) await job.remove();
    } catch (e) {}

    try {
      await db.delete(jobs).where(eq(jobs.id, parsedId));
    } catch {}

    inMemoryJobs.delete(parsedId);
    return { success: true };
  });
}
