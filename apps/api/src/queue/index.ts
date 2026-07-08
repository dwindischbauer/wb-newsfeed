import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { jobs, articles } from '../db/schema';
import { eq } from 'drizzle-orm';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const generationQueue = new Queue('generation_jobs', { connection });

export const worker = new Worker('generation_jobs', async job => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  const { jobId, articleId } = job.data;
  
  await db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, jobId));
  
  try {
    const articleRes = await db.select().from(articles).where(eq(articles.id, articleId));
    if (articleRes.length === 0) {
      throw new Error('Article not found');
    }
    const article = articleRes[0];

    const promptText = `Fasse den folgenden Nachrichtenartikel in maximal 3 prägnanten Sätzen zusammen. Fokussiere dich auf die Kernpunkte:\n\n${article.content}`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b-instruct',
        prompt: promptText,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    await db.update(articles).set({ teaser: data.response }).where(eq(articles.id, articleId));
    await db.update(jobs).set({ status: 'completed', result: data.response }).where(eq(jobs.id, jobId));
  } catch (error: any) {
    await db.update(jobs).set({ status: 'failed', error: error.message }).where(eq(jobs.id, jobId));
  }
}, { connection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`${job?.id} has failed with ${err.message}`);
});
