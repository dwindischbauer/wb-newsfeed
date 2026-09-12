import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { jobs, articles, settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const generationQueue = new Queue('generation_jobs', { connection });
logger.info('Generation queue initialized');


setTimeout(async () => {
  try {
    const orphaned = await db.select().from(jobs).where(eq(jobs.status, 'pending'));
    for (const job of orphaned) {
      const qJob = await generationQueue.getJob(`job-${job.id}`);
      if (!qJob) {
        logger.info(`Cleaning up orphaned pending job ${job.id}`);
        await db.update(jobs).set({ status: 'failed', error: 'Orphaned pending job' }).where(eq(jobs.id, job.id));
      }
    }
  } catch (err) {
    logger.error('Failed to clean up orphaned jobs', err);
  }
}, 2000);

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

    if (job.name === 'teaser_generation' || job.name === 'full_generation') {
      const promptText = `Du bist ein erfahrener Nachrichten-Redakteur. Analysiere den folgenden Artikel.
Antworte exakt im JSON Format mit folgenden Feldern:
- "title": Ein passender, kurzer, knackiger Titel für den Artikel (max. 60 Zeichen). Falls der aktuelle Titel nicht "[Auto-Titel ausstehend]" ist, kopiere den aktuellen Titel.
- "category": Ordne den Artikel genau einer dieser Kategorien zu: [Politik, Wirtschaft, Sport, Technologie, Kultur]. Falls die aktuelle Kategorie nicht "Auto" ist, kopiere die aktuelle Kategorie.
- "teaser": Maximal 3 Sätze Zusammenfassung für einen Social-Media Newsfeed.
- "keyTakeaways": 3 wichtigste Stichpunkte als ein String, getrennt durch Bullet-Points (•).

Aktueller Titel: ${article.title}
Aktuelle Kategorie: ${article.category}

Hier ist der Artikel:
${article.content}`;

      const allSettings = await db.select().from(settings);
      const settingsMap = allSettings.reduce((acc, curr) => { acc[curr.key] = curr.value; return acc; }, {} as Record<string, string>);
      
      const ollamaUrl = settingsMap['ollamaUrl'] || 'http://localhost:11434';
      const aiModel = settingsMap['aiModel'] || 'llama3.1:8b-instruct-q4_0';
      const timeoutMs = parseInt(settingsMap['timeout'] || '120000', 10);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiModel,
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
        resultObj = { teaser: data.response, keyTakeaways: '' };
      }
      
      const finalTitle = resultObj.title && resultObj.title !== '[Auto-Titel ausstehend]' ? resultObj.title : article.title;
      const finalCategory = resultObj.category && resultObj.category !== 'Auto' ? resultObj.category : article.category;

      await db.update(articles).set({ 
        title: finalTitle,
        category: finalCategory,
        teaser: resultObj.teaser,
        keyTakeaways: resultObj.keyTakeaways 
      }).where(eq(articles.id, articleId));
    }

    // Refetch the updated article for image generation
    const updatedArticleRes = await db.select().from(articles).where(eq(articles.id, articleId));
    const updatedArticle = updatedArticleRes[0] || article;

    // Step 2: Generate cover image (only if requested explicitly via job.name)
    let imageUrl: string | null = article.imageUrl;
    
    if (job.name === 'full_generation' || job.name === 'image_generation') {
      try {
        const { generateArticleImage } = await import('../services/imageGenerator');
        imageUrl = await generateArticleImage(updatedArticle.title, updatedArticle.category, articleId);
        if (imageUrl) {
          await db.update(articles).set({ imageUrl }).where(eq(articles.id, articleId));
          logger.info(`Cover image generated for article ${articleId}`, { imageUrl });
        }
      } catch (imgError: any) {
        logger.warn(`Image generation skipped: ${imgError.message}`);
      }
    }
    
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    let resultMsg = 'Erfolgreich generiert';
    if (job.name === 'teaser_generation') resultMsg = 'Text-Teaser generiert';
    if (job.name === 'image_generation') resultMsg = 'KI-Bild generiert';
    if (job.name === 'full_generation') resultMsg = imageUrl ? 'Teaser + Bild generiert' : 'Teaser generiert';

    await db.update(jobs).set({ 
      status: 'completed', 
      result: resultMsg,
      processingTimeMs: processingTimeMs
    }).where(eq(jobs.id, jobId));
  } catch (error: any) {
    logger.error(`Job ${job.id} failed: ${error.message}`);
    await db.update(jobs).set({ 
      status: 'failed', 
      error: error.message 
    }).where(eq(jobs.id, jobId));
    throw error; // Rethrow to let BullMQ handle retries
  }
}, { connection });

worker.on('completed', job => {
  logger.info(`${job.id} has completed!`, { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error(`${job?.id} has failed with ${err.message}`, { jobId: job?.id, error: err.message });
});
