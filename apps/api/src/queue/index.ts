import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { jobs, articles, settings, tags, articleTags } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const generationQueue = new Queue('generation_jobs', { connection });
logger.info('Generation queue initialized');


generationQueue.waitUntilReady().then(async () => {
  try {
    const orphaned = await db.select().from(jobs).where(eq(jobs.status, 'pending'));
    const now = Date.now();
    for (const job of orphaned) {
      // Only clean up jobs that were created at least 30 seconds ago
      const createdAtMs = job.createdAt ? new Date(job.createdAt).getTime() : 0;
      if (now - createdAtMs > 30000) {
        const qJob = await generationQueue.getJob(`job-${job.id}`);
        if (!qJob) {
          logger.info(`Cleaning up orphaned pending job ${job.id}`);
          await db.update(jobs).set({ status: 'failed', error: 'Orphaned pending job' }).where(eq(jobs.id, job.id));
        }
      }
    }
  } catch (err) {
    logger.error('Failed to clean up orphaned jobs', err);
  }
}).catch(err => {
  logger.warn('Queue readiness check error:', err.message);
});

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
      const { summarizeArticle } = await import('../services/summarizer');
      const resultObj = await summarizeArticle(article.content, article.title, article.category);

      await db.update(articles).set({
        title: resultObj.title,
        category: resultObj.category,
        teaser: resultObj.teaser,
        keyTakeaways: resultObj.keyTakeaways
      }).where(eq(articles.id, articleId));

      // Auto-assign tags returned by AI
      if (resultObj.tags.length > 0) {
        const existingTags = await db.select().from(tags);
        for (const tagName of resultObj.tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;

          let tagId: number;
          const existing = existingTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
          if (existing) {
            tagId = existing.id;
          } else {
            const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `tag-${Date.now()}`;
            const inserted = await db.insert(tags).values({ name: trimmed, slug }).returning();
            tagId = inserted[0].id;
          }

          try {
            await db.insert(articleTags).values({ articleId, tagId });
          } catch (e) {
            // Already linked, ignore duplicate
          }
        }
      }
    }

    // Refetch the updated article for image generation
    const updatedArticleRes = await db.select().from(articles).where(eq(articles.id, articleId));
    const updatedArticle = updatedArticleRes[0] || article;

    // Step 2: Generate cover image (only if requested explicitly via job.name)
    let imageUrl: string | null = article.imageUrl;
    
    if (job.name === 'full_generation' || job.name === 'image_generation') {
      try {
        // Query assigned tags for the article to supply richer image context
        const assignedTags = await db
          .select({ name: tags.name })
          .from(articleTags)
          .innerJoin(tags, eq(articleTags.tagId, tags.id))
          .where(eq(articleTags.articleId, articleId));
        const tagNames = assignedTags.map(t => t.name);

        const { generateArticleImage } = await import('../services/imageGenerator');
        imageUrl = await generateArticleImage(
          updatedArticle.title, 
          updatedArticle.category, 
          articleId,
          updatedArticle.teaser || undefined,
          tagNames
        );
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
