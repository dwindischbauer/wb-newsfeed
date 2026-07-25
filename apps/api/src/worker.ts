import { Worker, Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { generationJobs, teasers, logs } from './db/schema.js';
import { redisConnectionOptions } from './queue/redis.connection.js';
import { TEASER_QUEUE_NAME, TeaserJobData } from './queue/teaserQueue.js';
import { logger } from './services/logger.service.js';
import { OllamaTeaserGenerator } from './services/teaserGenerator.service.js';

const teaserGenerator = new OllamaTeaserGenerator();

export async function processTeaserJob(job: Job<TeaserJobData>) {
  const { jobId, articleId, title, content } = job.data;
  logger.info({ jobId, articleId }, `Processing job for article: "${title}"`);

  await db
    .update(generationJobs)
    .set({
      status: 'processing',
      attempts: job.attemptsMade + 1,
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));

  try {
    const result = await teaserGenerator.generateTeaser(title, content);

    const [insertedTeaser] = await db
      .insert(teasers)
      .values({
        articleId,
        jobId,
        headline: result.headline,
        summary: result.summary,
        keyTakeaways: result.keyTakeaways,
        sentiment: result.sentiment,
        language: result.language,
        modelUsed: result.modelUsed,
      })
      .returning();

    await db
      .update(generationJobs)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, jobId));

    await db.insert(logs).values({
      jobId,
      level: 'info',
      message: 'Teaser generated successfully',
      metadata: { teaserId: insertedTeaser.id, model: result.modelUsed },
    });

    logger.info({ jobId, teaserId: insertedTeaser.id }, 'Teaser generated and persisted successfully');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ jobId, err }, 'Failed to generate teaser');

    await db
      .update(generationJobs)
      .set({
        status: 'failed',
        error: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, jobId));

    await db.insert(logs).values({
      jobId,
      level: 'error',
      message: `Teaser generation failed: ${errorMessage}`,
    });

    throw err;
  }
}

export function startWorker() {
  const worker = new Worker<TeaserJobData>(TEASER_QUEUE_NAME, processTeaserJob, {
    connection: redisConnectionOptions,
    concurrency: 2,
  });

  logger.info('BullMQ Background worker ready');
  return worker;
}

if (process.env.NODE_ENV !== 'test') {
  startWorker();
}
