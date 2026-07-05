import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const generationQueue = new Queue('generation_jobs', { connection });

export const worker = new Worker('generation_jobs', async job => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  const { jobId, articleId } = job.data;
  
  await db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, jobId));
  
  // Placeholder for Ollama generation logic
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await db.update(jobs).set({ status: 'completed', result: 'Dummy Teaser generated' }).where(eq(jobs.id, jobId));
}, { connection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`${job?.id} has failed with ${err.message}`);
});
