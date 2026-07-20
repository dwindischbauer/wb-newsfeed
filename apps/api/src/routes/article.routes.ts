import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { articles, generationJobs } from '../db/schema.js';
import { logger } from '../services/logger.service.js';

const createArticleSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  author: z.string().optional(),
  source: z.string().optional().default('manual'),
  url: z.string().url().optional(),
});

export async function articleRoutes(fastify: FastifyInstance) {
  fastify.post('/api/articles', async (request, reply) => {
    const body = createArticleSchema.parse(request.body);

    const [insertedArticle] = await db
      .insert(articles)
      .values({
        title: body.title,
        content: body.content,
        author: body.author,
        source: body.source,
        url: body.url,
      })
      .returning();

    const [job] = await db
      .insert(generationJobs)
      .values({
        articleId: insertedArticle.id,
        status: 'pending',
      })
      .returning();

    logger.info({ articleId: insertedArticle.id, jobId: job.id }, 'Article ingested and job created');

    return reply.status(201).send({
      message: 'Article accepted for teaser generation',
      article: insertedArticle,
      job,
    });
  });
}
