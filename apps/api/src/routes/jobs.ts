import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { jobs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  server.get('/api/jobs', async (request, reply) => {
    const { status } = request.query as { status?: string };
    let query = db.select().from(jobs).orderBy(desc(jobs.createdAt));
    
    if (status) {
      const allJobs = await query;
      return allJobs.filter(j => j.status === status);
    }
    
    return await query;
  });

  server.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const jobRes = await db.select().from(jobs).where(eq(jobs.id, parseInt(id)));
    if (jobRes.length === 0) {
      reply.status(404).send({ error: 'Job not found' });
      return;
    }
    return jobRes[0];
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
    await generationQueue.add(body.type, { jobId: newJob[0].id, articleId: body.articleId });
    
    return newJob[0];
  });
}
