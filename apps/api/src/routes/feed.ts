import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, tags, articleTags } from '../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  server.get('/api/feed', async (request, reply) => {
    const query = request.query as { tag?: string; category?: string };

    let publishedArticles = await db
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

    let result = publishedArticles.map(a => ({
      ...a,
      tags: tagsMap.get(a.id) || []
    }));

    if (query.tag) {
      const filterTag = query.tag.toLowerCase();
      result = result.filter(a => a.tags.some(t => t.slug === filterTag || t.name.toLowerCase() === filterTag));
    }

    if (query.category && query.category !== 'Alle') {
      result = result.filter(a => a.category.toLowerCase() === query.category?.toLowerCase());
    }
      
    return result;
  });
}
