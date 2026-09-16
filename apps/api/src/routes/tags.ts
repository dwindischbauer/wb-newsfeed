import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { tags, articleTags } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function (server: FastifyInstance) {
  server.get('/api/tags', async (request, reply) => {
    try {
      const allTags = await db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          color: tags.color,
          createdAt: tags.createdAt,
          articleCount: sql<number>`count(${articleTags.articleId})::int`
        })
        .from(tags)
        .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
        .groupBy(tags.id)
        .orderBy(desc(sql`count(${articleTags.articleId})`), tags.name);

      return allTags;
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch tags', details: error instanceof Error ? error.message : String(error) });
    }
  });

  server.post('/api/tags', async (request, reply) => {
    const body = request.body as { name?: string; color?: string };
    if (!body || !body.name || body.name.trim().length === 0) {
      return reply.status(400).send({ error: 'Tag-Name ist erforderlich' });
    }

    const trimmedName = body.name.trim();
    const slug = slugify(trimmedName);

    // Check if tag already exists
    const existing = await db.select().from(tags).where(eq(tags.name, trimmedName));
    if (existing.length > 0) {
      return existing[0];
    }

    try {
      const newTag = await db.insert(tags).values({
        name: trimmedName,
        slug: slug || `tag-${Date.now()}`,
        color: body.color || '#3b82f6'
      }).returning();

      return newTag[0];
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to create tag', details: error instanceof Error ? error.message : String(error) });
    }
  });

  server.delete('/api/tags/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return reply.status(400).send({ error: 'Invalid tag ID' });
    }

    try {
      await db.delete(tags).where(eq(tags.id, parsedId));
      return { success: true };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to delete tag', details: error instanceof Error ? error.message : String(error) });
    }
  });
}
