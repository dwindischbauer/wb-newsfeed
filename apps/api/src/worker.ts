import { Worker, Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { generationJobs, logs } from './db/schema.js';
import { redisConnectionOptions } from './queue/redis.connection.js';
import { TEASER_QUEUE_NAME, TeaserJobData } from './queue/teaserQueue.js';
import { logger } from './services/logger.service.js';

export async function processTeaserJob(job: Job<TeaserJobData>) {
  const { jobId, articleId, title } = job.data;
  logger.info({ jobId, articleId }, `Started processing teaser job for article: "${title}"`);

  // Update status to processing
  await db
    .update(generationJobs)
    .set({
      status: 'processing',
      attempts: job.attemptsMade + 1,
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));

  await db.insert(logs).values({
    jobId,
    level: 'info',
    message: `Job processing started (attempt ${job.attemptsMade + 1})`,
    metadata: { attempt: job.attemptsMade + 1 },
  });

  logger.info({ jobId }, 'Job structure established, worker awaiting LLM service integration');
}

export function startWorker() {
  const worker = new Worker<TeaserJobData>(TEASER_QUEUE_NAME, processTeaserJob, {
    connection: redisConnectionOptions,
    concurrency: 2,
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    logger.error({ jobId: job.data.jobId, err }, 'Job processing failed');

    await db
      .update(generationJobs)
      .set({
        status: 'failed',
        error: err.message,
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, job.data.jobId));

    await db.insert(logs).values({
      jobId: job.data.jobId,
      level: 'error',
      message: `Job failed: ${err.message}`,
    });
  });

  logger.info('BullMQ Background worker initialized and waiting for jobs');
  return worker;
}

if (process.env.NODE_ENV !== 'test') {
  startWorker();
}
