import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { jobs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  server.get('/api/jobs', async (request, reply) => {
    const { status } = request.query as { status?: string };
    
    if (status) {
      return await db.select().from(jobs).where(eq(jobs.status, status)).orderBy(desc(jobs.createdAt));
    }
    
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  });

  server.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid job ID' });
      return;
    }
    const jobRes = await db.select().from(jobs).where(eq(jobs.id, parsedId));
    if (jobRes.length === 0) {
      reply.status(404).send({ error: 'Job not found' });
      return;
    }
    return jobRes[0];
  });

  server.post('/api/jobs/:id/retry', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid job ID' });
      return;
    }
    
    // Find job in db
    const jobRecord = await db.select().from(jobs).where(eq(jobs.id, parsedId));
    if (!jobRecord.length) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Update status to pending
    await db.update(jobs).set({ status: 'pending', error: null }).where(eq(jobs.id, parsedId));
    
    // Add to queue
    const { generationQueue } = await import('../queue');
    await generationQueue.add(jobRecord[0].type, {
      jobId: parseInt(id),
      articleId: jobRecord[0].articleId
    });

    return { success: true };
  });

  server.post('/api/jobs', async (request, reply) => {
    const body = request.body as { articleId?: number, type?: string };
    
    if (!body.articleId || !body.type) {
      reply.status(400);
      return { success: false, error: 'Missing articleId or type' };
    }

    const newJob = await db.insert(jobs).values({
      articleId: body.articleId,
      type: body.type,
      status: 'pending'
    }).returning();
    
    const { generationQueue } = await import('../queue');
    await generationQueue.add(body.type, { jobId: newJob[0].id, articleId: body.articleId }, { jobId: newJob[0].id.toString() });
    
    return newJob[0];
  });

  server.delete('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid job ID' });
      return;
    }
    
    // Attempt to remove from queue if it exists
    try {
      const { generationQueue } = await import('../queue');
      const job = await generationQueue.getJob(id);
      if (job) {
        await job.remove();
      }
    } catch (e) {
      // Ignore queue errors
    }

    await db.delete(jobs).where(eq(jobs.id, parsedId));
    return { success: true };
  });
}
