import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, tags, articleTags } from '../db/schema';
import { eq, desc, inArray, count, max } from 'drizzle-orm';
import { inMemoryArticles, type StoredArticle } from './articles';

// Upper bound for serving a cached feed, as a safety net for changes the
// fingerprint cannot see (e.g. a renamed tag).
const FEED_CACHE_TTL_MS = 60_000;

let feedCache: { fingerprint: string; createdAt: number; articles: StoredArticle[] } | null = null;

/**
 * Cheap aggregate over everything the feed is built from. Every write to an
 * article goes through Drizzle and bumps updated_at ($onUpdate); publishing,
 * unpublishing and deleting change the count; tag links change the link stats.
 */
async function feedFingerprint(): Promise<string> {
  const [a] = await db
    .select({ n: count(), lastUpdate: max(articles.updatedAt) })
    .from(articles)
    .where(eq(articles.status, 'published'));
  const [t] = await db.select({ n: count(), lastId: max(articleTags.id) }).from(articleTags);
  return `${a?.n}:${a?.lastUpdate?.getTime() ?? 0}:${t?.n}:${t?.lastId ?? 0}`;
}

async function loadPublishedFeed(): Promise<StoredArticle[]> {
  const publishedArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.createdAt));

  const articleIds = publishedArticles.map((a) => a.id);
  const tagsMap = new Map<number, Array<{ id: number; name: string; slug: string; color: string | null }>>();

  if (articleIds.length > 0) {
    const records = await db
      .select({
        articleId: articleTags.articleId,
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        color: tags.color
      })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(inArray(articleTags.articleId, articleIds));

    for (const r of records) {
      const list = tagsMap.get(r.articleId) || [];
      list.push({ id: r.id, name: r.name, slug: r.slug, color: r.color });
      tagsMap.set(r.articleId, list);
    }
  }

  return publishedArticles.map((a) => ({
    ...a,
    tags: tagsMap.get(a.id) || []
  }));
}

export default async function (server: FastifyInstance) {
  server.get('/api/feed', async (request, reply) => {
    const query = request.query as { tag?: string; category?: string; limit?: string; offset?: string };

    let result: StoredArticle[] = [];
    let cacheStatus = 'MISS';
    try {
      const fingerprint = await feedFingerprint();
      if (feedCache && feedCache.fingerprint === fingerprint && Date.now() - feedCache.createdAt < FEED_CACHE_TTL_MS) {
        cacheStatus = 'HIT';
      } else {
        feedCache = { fingerprint, createdAt: Date.now(), articles: await loadPublishedFeed() };
      }
      result = feedCache.articles;
    } catch {
      cacheStatus = 'BYPASS';
      server.log.warn('DB offline, serving published feed from in-memory store');
      result = Array.from(inMemoryArticles.values())
        .filter((a) => a.status === 'published')
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    }

    if (query.tag) {
      const filterTag = query.tag.toLowerCase();
      result = result.filter((a) => a.tags && a.tags.some((t) => (t.slug || t.name || '').toLowerCase() === filterTag));
    }

    if (query.category && query.category !== 'Alle') {
      result = result.filter(a => a.category.toLowerCase() === query.category?.toLowerCase());
    }

    // Support limit and offset for scalable snap-scrolling
    const limit = query.limit ? Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100) : null;
    const offset = query.offset ? Math.max(parseInt(query.offset, 10) || 0, 0) : 0;

    if (limit !== null) {
      result = result.slice(offset, offset + limit);
    }

    // ETag over the exact response: polling clients (browsers revalidate
    // automatically because of no-cache) get an empty 304 when nothing changed.
    const body = JSON.stringify(result);
    const etag = `"${createHash('sha1').update(body).digest('base64url')}"`;
    reply.header('Cache-Control', 'no-cache');
    reply.header('ETag', etag);
    reply.header('X-Feed-Cache', cacheStatus);
    if (request.headers['if-none-match'] === etag) {
      return reply.code(304).send();
    }
    return reply.type('application/json; charset=utf-8').send(body);
  });
}
