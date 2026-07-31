import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { articles, generationJobs } from '../db/schema.js';
import { logger } from '../services/logger.service.js';
import { StandardCMSAdapter } from '../adapters/ingestion.adapter.js';
import { teaserQueue } from '../queue/teaserQueue.js';

export async function articleRoutes(fastify: FastifyInstance) {
  const cmsAdapter = new StandardCMSAdapter();

  fastify.post('/api/articles', async (request, reply) => {
    const normalized = cmsAdapter.normalize(request.body);
    const initialStatus = (request.body as any)?.status || 'Veröffentlicht';

    const [insertedArticle] = await db
      .insert(articles)
      .values({
        externalId: normalized.externalId,
        title: normalized.title,
        content: normalized.content,
        author: normalized.author,
        source: normalized.source,
        url: normalized.url,
        status: initialStatus,
        publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : new Date(),
      })
      .returning();

    const [job] = await db
      .insert(generationJobs)
      .values({
        articleId: insertedArticle.id,
        status: 'pending',
      })
      .returning();

    await teaserQueue.add('generate-teaser', {
      jobId: job.id,
      articleId: insertedArticle.id,
      title: insertedArticle.title,
      content: insertedArticle.content,
    });

    logger.info({ articleId: insertedArticle.id, jobId: job.id }, 'Article ingested and pushed to queue');

    return reply.status(201).send({
      message: 'Article ingested successfully',
      article: insertedArticle,
      job,
    });
  });

  fastify.patch('/api/articles/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const [updated] = await db
      .update(articles)
      .set({ status, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();

    logger.info({ articleId: id, newStatus: status }, 'Article status updated');
    return reply.send({ article: updated });
  });

  fastify.delete('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(articles).where(eq(articles.id, id));
    return reply.send({ message: 'Article deleted' });
  });
}
