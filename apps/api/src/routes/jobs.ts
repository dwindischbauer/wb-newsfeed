import type { FastifyInstance } from 'fastify';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from '../db';
import { jobs, articles } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { inMemoryArticles, type StoredArticle } from './articles';
import { autoExtractArticleMetadata } from '../utils/metadata';
import { generateArticleImage } from '../services/imageGenerator';
import { recordGenerationVersion } from '../services/versions';

type JobRecord = InferSelectModel<typeof jobs>;

export const inMemoryJobs: Map<number, JobRecord> = new Map();
let jobCounter = 100;

const tagInputName = (t: string | { name: string }): string => (typeof t === 'string' ? t : t.name);

export async function executeDirectJob(jobId: number, articleId: number, type: string) {
  const startTime = Date.now();
  const updateJob = async (fields: Partial<JobRecord>) => {
    try {
      await db.update(jobs).set(fields).where(eq(jobs.id, jobId));
    } catch {
      // best-effort DB update — in-memory mirror below is always kept in sync
    }
    const mem = inMemoryJobs.get(jobId);
    if (mem) {
      inMemoryJobs.set(jobId, { ...mem, ...fields, updatedAt: new Date() });
    }
  };

  await updateJob({ status: 'processing' });

  try {
    let article: StoredArticle | null = null;
    try {
      const dbRes = await db.select().from(articles).where(eq(articles.id, articleId));
      if (dbRes.length > 0 && dbRes[0]) article = { ...dbRes[0], tags: [] };
    } catch {
      // fall through to in-memory lookup
    }
    if (!article) {
      article = inMemoryArticles.get(articleId) || null;
    }
    if (!article) {
      throw new Error('Article not found');
    }

    if (type === 'teaser_generation' || type === 'full_generation') {
      const meta = autoExtractArticleMetadata(article.content, article.category);
      const newTitle = (!article.title || article.title === '[Auto-Titel ausstehend]') ? meta.title : article.title;
      const newCategory = (!article.category || article.category === 'Auto' || article.category === 'Allgemein') ? meta.category : article.category;

      const updateData = {
        title: newTitle,
        category: newCategory,
        teaser: meta.teaser,
        keyTakeaways: meta.keyTakeaways
      };

      try {
        await db.update(articles).set(updateData).where(eq(articles.id, articleId));
        await recordGenerationVersion({
          articleId,
          content: article.content,
          ...updateData,
          tags: meta.tags.map((t) => t.name),
          source: 'fallback',
          jobId
        });
      } catch {
        // best-effort — in-memory mirror below still gets the update
      }

      const mem = inMemoryArticles.get(articleId);
      if (mem) {
        const mergedTags = (mem.tags && mem.tags.length > 0)
          ? mem.tags
          : meta.tags.map((t, idx) => ({ id: idx + 1, name: t.name, slug: t.slug, color: t.color }));
        inMemoryArticles.set(articleId, { ...mem, ...updateData, tags: mergedTags, updatedAt: new Date() });
      }
    }

    if (type === 'image_generation' || type === 'full_generation') {
      const tagsList = (article.tags || []).map(tagInputName);
      const imgUrl = await generateArticleImage(
        article.title,
        article.category,
        article.id,
        article.teaser ?? undefined,
        tagsList
      );
      if (imgUrl) {
        try {
          await db.update(articles).set({ imageUrl: imgUrl }).where(eq(articles.id, articleId));
        } catch {
          // best-effort — in-memory mirror below still gets the new image
        }
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
  } catch (err) {
    await updateJob({
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      processingTimeMs: Date.now() - startTime
    });
  }
}

export default async function (server: FastifyInstance) {
  server.get('/api/jobs', async (request) => {
    const { status } = request.query as { status?: string };

    let list: JobRecord[] = [];
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
      if (status) list = list.filter((j) => j.status === status);
      list.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    }

    return list.map((j) => ({ ...j, jobId: j.id }));
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
      if (jobRes.length > 0 && jobRes[0]) {
        inMemoryJobs.set(parsedId, jobRes[0]);
        return { ...jobRes[0], jobId: jobRes[0].id };
      }
    } catch {
      // fall through to in-memory lookup
    }

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

    let jobRecord: JobRecord | null = null;
    try {
      const res = await db.select().from(jobs).where(eq(jobs.id, parsedId));
      if (res.length > 0 && res[0]) jobRecord = res[0];
    } catch {
      // fall through to in-memory lookup
    }

    if (!jobRecord) {
      jobRecord = inMemoryJobs.get(parsedId) || null;
    }

    if (!jobRecord || jobRecord.articleId === null) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    setImmediate(() => {
      executeDirectJob(parsedId, jobRecord.articleId!, jobRecord.type);
    });

    return { success: true };
  });

  server.post('/api/jobs', async (request, reply) => {
    const body = request.body as { articleId?: number; type?: string };

    if (!body.articleId || !body.type) {
      reply.status(400);
      return { success: false, error: 'Missing articleId or type' };
    }

    let jobRecord: JobRecord;
    try {
      const newJob = await db.insert(jobs).values({
        articleId: body.articleId,
        type: body.type,
        status: 'pending'
      }).returning();
      if (!newJob[0]) throw new Error('Insert returned no row');
      jobRecord = newJob[0];
    } catch {
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
    } catch {
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
    } catch {
      // best-effort queue cleanup
    }

    try {
      await db.delete(jobs).where(eq(jobs.id, parsedId));
    } catch {
      // best-effort DB cleanup
    }

    inMemoryJobs.delete(parsedId);
    return { success: true };
  });
}
