import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { jobs, articles, tags, articleTags } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const generationQueue = new Queue('generation_jobs', { connection });
logger.info('Generation queue initialized');

export type GenerationType = 'teaser_generation' | 'image_generation' | 'full_generation';

export interface GenerationJobData {
  jobId: number;
  articleId: number;
  type?: GenerationType;
  /** Let the model replace the stored title/category (they are only placeholders). */
  autoTitle?: boolean;
  autoCategory?: boolean;
  /** Why the job was started, e.g. 'created' or 'content_changed'. */
  trigger?: string;
}

/**
 * Creates a job row and puts it on the BullMQ queue. Used wherever an article
 * is created or its content changes, so generation starts without the client
 * having to call /api/jobs itself. If Redis is unreachable the job row is
 * marked failed instead of silently staying 'pending'.
 */
export async function enqueueGeneration(
  articleId: number,
  type: GenerationType,
  options: Omit<GenerationJobData, 'jobId' | 'articleId' | 'type'> = {}
): Promise<{ jobId: number; queued: boolean }> {
  const [jobRow] = await db.insert(jobs).values({ articleId, type, status: 'pending' }).returning();
  if (!jobRow) throw new Error('Job-Erstellung fehlgeschlagen');

  try {
    const data: GenerationJobData = { jobId: jobRow.id, articleId, type, ...options };
    await generationQueue.add(type, data, {
      jobId: `job-${jobRow.id}`,
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 }
    });
    return { jobId: jobRow.id, queued: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(jobs).set({ status: 'failed', error: `Job enqueuing failed: ${message}` }).where(eq(jobs.id, jobRow.id));
    return { jobId: jobRow.id, queued: false };
  }
}


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
    logger.error('Failed to clean up orphaned jobs', { error: err instanceof Error ? err.message : String(err) });
  }
}).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.warn(`Queue readiness check error: ${message}`);
});

export const worker = new Worker('generation_jobs', async job => {
  logger.info(`Processing job ${job.id} of type ${job.name}`, { jobId: job.id, type: job.name });
  const { jobId, articleId, autoTitle, autoCategory } = job.data as GenerationJobData;
  const startTime = Date.now();
  let generationSource: 'ai' | 'fallback' | null = null;
  
  await db.update(jobs).set({ status: 'processing' }).where(eq(jobs.id, jobId));
  
  try {
    const articleRes = await db.select().from(articles).where(eq(articles.id, articleId));
    if (articleRes.length === 0) {
      throw new Error('Article not found');
    }
    const article = articleRes[0];

    if (job.name === 'teaser_generation' || job.name === 'full_generation') {
      const { summarizeArticle } = await import('../services/summarizer');
      const resultObj = await summarizeArticle(
        article.content,
        autoTitle ? '[Auto-Titel ausstehend]' : article.title,
        autoCategory ? 'Auto' : article.category
      );
      generationSource = resultObj.source;

      await db.update(articles).set({
        title: resultObj.title,
        category: resultObj.category,
        teaser: resultObj.teaser,
        keyTakeaways: resultObj.keyTakeaways
      }).where(eq(articles.id, articleId));

      const { recordGenerationVersion } = await import('../services/versions');
      await recordGenerationVersion({
        articleId,
        content: article.content,
        title: resultObj.title,
        category: resultObj.category,
        teaser: resultObj.teaser,
        keyTakeaways: resultObj.keyTakeaways,
        tags: resultObj.tags,
        source: resultObj.source,
        generation: resultObj.generation,
        jobId
      });

      // Auto-assign tags returned by AI, but never pile new tags onto an
      // article that already has some (e.g. on regeneration after an edit).
      const currentTags = await db.select({ id: articleTags.id }).from(articleTags).where(eq(articleTags.articleId, articleId));
      if (resultObj.tags.length > 0 && currentTags.length === 0) {
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
          } catch {
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
      } catch (imgError) {
        const message = imgError instanceof Error ? imgError.message : String(imgError);
        logger.warn(`Image generation skipped: ${message}`);
      }
    }
    
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    let resultMsg = 'Erfolgreich generiert';
    if (job.name === 'teaser_generation') resultMsg = 'Text-Teaser generiert';
    if (job.name === 'image_generation') resultMsg = 'KI-Bild generiert';
    if (job.name === 'full_generation') resultMsg = imageUrl ? 'Teaser + Bild generiert' : 'Teaser generiert';
    if (generationSource === 'fallback') resultMsg += ' (Fallback ohne KI – Ollama nicht erreichbar)';

    await db.update(jobs).set({ 
      status: 'completed', 
      result: resultMsg,
      processingTimeMs: processingTimeMs
    }).where(eq(jobs.id, jobId));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Job ${job.id} failed: ${message}`);
    await db.update(jobs).set({
      status: 'failed',
      error: message
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
