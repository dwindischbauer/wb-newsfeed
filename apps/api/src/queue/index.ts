import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { jobs, articles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const generationQueue = new Queue('generation_jobs', { connection });
logger.info('Generation queue initialized');

export const worker = new Worker('generation_jobs', async job => {
  logger.info(`Processing job ${job.id} of type ${job.name}`, { jobId: job.id, type: job.name });
  const { jobId, articleId } = job.data;
  const startTime = Date.now();
  
  await db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, jobId));
  
  try {
    const articleRes = await db.select().from(articles).where(eq(articles.id, articleId));
    if (articleRes.length === 0) {
      throw new Error('Article not found');
    }
    const article = articleRes[0];

    const promptText = `Du bist ein erfahrener Nachrichten-Redakteur. Fasse den folgenden Artikel zusammen.
Antworte exakt im JSON Format mit zwei Feldern: "teaser" (maximal 3 Sätze Zusammenfassung) und "keyTakeaways" (3 Stichpunkte als ein String, getrennt durch Bullet-Points).
Hier ist der Artikel:
${article.content}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b-instruct',
        prompt: promptText,
        stream: false,
        format: 'json'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    let resultObj;
    try {
      resultObj = JSON.parse(data.response);
    } catch (e) {
      // Fallback if model failed to output strict JSON
      resultObj = { teaser: data.response, keyTakeaways: '' };
    }
    
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    await db.update(articles).set({ 
      teaser: resultObj.teaser,
      keyTakeaways: resultObj.keyTakeaways 
    }).where(eq(articles.id, articleId));
    
    await db.update(jobs).set({ 
      status: 'completed', 
      result: 'Erfolgreich generiert',
      processingTimeMs: processingTimeMs
    }).where(eq(jobs.id, jobId));
  } catch (error: any) {
    await db.update(jobs).set({ status: 'failed', error: error.message }).where(eq(jobs.id, jobId));
  }
}, { connection });

worker.on('completed', job => {
  logger.info(`${job.id} has completed!`, { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error(`${job?.id} has failed with ${err.message}`, { jobId: job?.id, error: err.message });
});
