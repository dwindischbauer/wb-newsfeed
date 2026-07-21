import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { articles, generationJobs } from '../db/schema.js';
import { logger } from '../services/logger.service.js';
import { StandardCMSAdapter } from '../adapters/ingestion.adapter.js';

export async function articleRoutes(fastify: FastifyInstance) {
  const cmsAdapter = new StandardCMSAdapter();

  fastify.post('/api/articles', async (request, reply) => {
    const normalized = cmsAdapter.normalize(request.body);

    const [insertedArticle] = await db
      .insert(articles)
      .values({
        externalId: normalized.externalId,
        title: normalized.title,
        content: normalized.content,
        author: normalized.author,
        source: normalized.source,
        url: normalized.url,
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

    logger.info({ articleId: insertedArticle.id, jobId: job.id }, 'Article ingested via adapter');

    return reply.status(201).send({
      message: 'Article ingested successfully',
      article: insertedArticle,
      job,
    });
  });
}
