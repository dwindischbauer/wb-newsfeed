import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, tags, articleTags } from '../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { inMemoryArticles, type ArticleRecord, type ArticleTagRef } from './articles';

export default async function (server: FastifyInstance) {
  server.get('/api/feed', async (request, _reply) => {
    const query = request.query as { tag?: string; category?: string; limit?: string; offset?: string };

    let result: ArticleRecord[] = [];
    try {
      const publishedArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.createdAt));

      const articleIds = publishedArticles.map(a => a.id);
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

      result = publishedArticles.map(a => ({
        ...a,
        tags: tagsMap.get(a.id) || []
      }));
    } catch {
      server.log.warn('DB offline, serving published feed from in-memory store');
      result = Array.from(inMemoryArticles.values())
        .filter((a) => a.status === 'published')
        .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    }

    if (query.tag) {
      // Match by name first — auto-generated slugs strip umlauts/&/spaces
      // and don't reliably round-trip back to the canonical tag name.
      const filterTag = query.tag.toLowerCase();
      result = result.filter(a => a.tags && a.tags.some((t: ArticleTagRef) => (t.name || '').toLowerCase() === filterTag || (t.slug || '').toLowerCase() === filterTag));
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
      
    return result;
  });
}
