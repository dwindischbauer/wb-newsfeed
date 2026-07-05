import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { jobs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  server.get('/api/jobs', async (request, reply) => {
    const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
    return allJobs;
  });

  server.post('/api/jobs', async (request, reply) => {
    const body = request.body as any;
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
