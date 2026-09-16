import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { articles, jobs, tags, articleTags } from '../db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { stripHtml } from '../utils/format';
import { generationQueue } from '../queue';

async function getTagsForArticles(articleIds: number[]): Promise<Map<number, Array<{ id: number; name: string; slug: string; color: string | null }>>> {
  const map = new Map<number, Array<{ id: number; name: string; slug: string; color: string | null }>>();
  if (articleIds.length === 0) return map;

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
    const list = map.get(r.articleId) || [];
    list.push({ id: r.id, name: r.name, slug: r.slug, color: r.color });
    map.set(r.articleId, list);
  }
  return map;
}

async function syncArticleTags(articleId: number, tagList: Array<number | string>) {
  // Delete existing tags for article
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

  if (!tagList || tagList.length === 0) return;

  for (const item of tagList) {
    let tagId: number | null = null;
    if (typeof item === 'number') {
      tagId = item;
    } else if (typeof item === 'string' && item.trim()) {
      const trimmed = item.trim();
      const existing = await db.select().from(tags).where(eq(tags.name, trimmed));
      if (existing.length > 0) {
        tagId = existing[0].id;
      } else {
        const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `tag-${Date.now()}`;
        const created = await db.insert(tags).values({ name: trimmed, slug }).returning();
        tagId = created[0].id;
      }
    }

    if (tagId) {
      await db.insert(articleTags).values({ articleId, tagId }).onConflictDoNothing?.() || await db.insert(articleTags).values({ articleId, tagId }).catch(() => {});
    }
  }
}

async function deletePhysicalImage(imageUrl: string | null | undefined) {
  if (!imageUrl || !imageUrl.startsWith('/images/')) return;
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filename = path.basename(imageUrl);
    const filepath = path.join(process.cwd(), 'public', 'images', filename);
    await fs.unlink(filepath);
  } catch (err: any) {
    // Ignore if file doesn't exist or already removed
  }
}

// Resilient In-Memory store for offline/demo reliability
let fallbackIdCounter = 100;
export const inMemoryArticles: Map<number, any> = new Map();

const defaultSeedArticles = [
  {
    id: 1,
    title: 'EU beschließt neues Regulierungspaket für Medienplattformen',
    content: 'In Brüssel haben sich die Medienminister der Mitgliedsstaaten auf eine weitreichende Neuregelung zur Verbreitung von Online-Nachrichten geeinigt. Ziel des Abkommens ist es, Qualitätsinhalte gegenüber Algorithmen großer Plattformen zu stärken und faire Vergütungsmodelle für Pressehäuser zu etablieren.',
    teaser: 'Die EU-Staaten beschließen neue Vorgaben für Nachrichten auf Digitalplattformen, um unabhängigen Qualitätsjournalismus gezielt abzusichern.',
    keyTakeaways: '• EU-Medienpaket stärkt europäische Pressehäuser\n• Neue Transparenzpflichten für algorithmische Feeds\n• Umsetzung durch die Mitgliedsstaaten bis Jahresende geplant',
    category: 'Politik',
    author: 'ORF.at Redaktion',
    status: 'published',
    imageUrl: null,
    createdAt: new Date('2026-09-16T10:00:00Z'),
    updatedAt: new Date('2026-09-16T10:00:00Z'),
    tags: [{ id: 1, name: 'Politik', slug: 'politik' }, { id: 2, name: 'EU', slug: 'eu' }, { id: 3, name: 'Digital', slug: 'digital' }]
  },
  {
    id: 2,
    title: 'KI revolutioniert Short-Form-Nachrichten in Redaktionen',
    content: 'Automatisierte Content-Pipelines halten Einzug in modernen Medienhäusern. Durch generative Sprachmodelle werden aus langen Printartikeln in Sekundenschnelle prägnante Teaser und Kernpunkte generiert, die für mobile Konsumenten aufbereitet sind.',
    teaser: 'Moderne KI-Pipelines unterstützen Journalisten bei der zeitnahen Aufbereitung von Eilmeldungen in vertikale Snap-Feeds.',
    keyTakeaways: '• Deutliche Zeitersparnis bei der Content-Aufbereitung\n• Höhere Leserbindung bei jüngeren Zielgruppen\n• Volle redaktionelle Endkontrolle im CMS Dashboard',
    category: 'Technologie',
    author: 'David Windischbauer & Stefan Schachner',
    status: 'published',
    imageUrl: null,
    createdAt: new Date('2026-09-16T11:15:00Z'),
    updatedAt: new Date('2026-09-16T11:15:00Z'),
    tags: [{ id: 4, name: 'Künstliche Intelligenz', slug: 'ki' }, { id: 5, name: 'Innovation', slug: 'innovation' }]
  },
  {
    id: 3,
    title: 'Österreichs Wirtschaft trotzt globalen Unsicherheiten',
    content: 'Die heimische Industrie zeigt sich laut aktuellem WIFO-Konjunkturbericht robuster als erwartet. Vor allem der Dienstleistungssektor und grüne Technologien stützen das Wachstum im dritten Quartal.',
    teaser: 'Aktuelle WIFO-Prognosen bestätigen eine stabile Konjunkturlage trotz verhaltener Weltkonjunktur.',
    keyTakeaways: '• WIFO sieht positive Wachstumsimpulse im 3. Quartal\n• Dienstleistungen und Umwelttechnik als Haupttreiber\n• Arbeitslosenquote bleibt auf historisch moderatem Niveau',
    category: 'Wirtschaft',
    author: 'Wirtschaftsredaktion',
    status: 'published',
    imageUrl: null,
    createdAt: new Date('2026-09-16T09:30:00Z'),
    updatedAt: new Date('2026-09-16T09:30:00Z'),
    tags: [{ id: 6, name: 'Wirtschaft', slug: 'wirtschaft' }, { id: 7, name: 'Finanzen', slug: 'finanzen' }]
  }
];

for (const a of defaultSeedArticles) {
  inMemoryArticles.set(a.id, a);
}

export default async function (server: FastifyInstance) {
  server.get('/api/articles', async (request, reply) => {
    const query = request.query as { tag?: string; category?: string };
    
    let result: any[] = [];
    try {
      const allArticles = await db.select().from(articles).orderBy(desc(articles.createdAt));
      const articleIds = allArticles.map(a => a.id);
      const tagsMap = await getTagsForArticles(articleIds);

      result = allArticles.map(a => ({
        ...a,
        content: stripHtml(a.content),
        tags: tagsMap.get(a.id) || []
      }));
      for (const item of result) {
        inMemoryArticles.set(item.id, item);
      }
    } catch (e: any) {
      server.log.warn('Database offline, reading from in-memory fallback store');
      result = Array.from(inMemoryArticles.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (query.tag) {
      const filterTag = query.tag.toLowerCase();
      result = result.filter(a => a.tags && a.tags.some((t: any) => (t.slug || t.name || '').toLowerCase() === filterTag));
    }
    if (query.category && query.category !== 'Alle') {
      result = result.filter(a => a.category && a.category.toLowerCase() === query.category?.toLowerCase());
    }

    return result;
  });

  server.get('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }

    try {
      const articleRes = await db.select().from(articles).where(eq(articles.id, parsedId));
      if (articleRes.length > 0) {
        const tagsMap = await getTagsForArticles([parsedId]);
        const res = {
          ...articleRes[0],
          tags: tagsMap.get(parsedId) || []
        };
        inMemoryArticles.set(parsedId, res);
        return res;
      }
    } catch {
      // Fallback
    }

    const cached = inMemoryArticles.get(parsedId);
    if (cached) return cached;

    reply.status(404).send({ error: 'Article not found' });
  });

  server.put('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    
    let dbSuccess = false;
    try {
      const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
      if (existing.length > 0) {
        const updateData: any = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.title !== undefined) updateData.title = body.title;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.teaser !== undefined) updateData.teaser = body.teaser;
        if (body.keyTakeaways !== undefined) updateData.keyTakeaways = body.keyTakeaways;
        if (body.author !== undefined) updateData.author = body.author;
        
        if (Object.keys(updateData).length > 0) {
          await db.update(articles).set(updateData).where(eq(articles.id, parsedId));
        }

        if (body.tags !== undefined && Array.isArray(body.tags)) {
          await syncArticleTags(parsedId, body.tags);
        } else if (body.tagIds !== undefined && Array.isArray(body.tagIds)) {
          await syncArticleTags(parsedId, body.tagIds);
        }
        dbSuccess = true;
      }
    } catch (e) {
      server.log.warn('DB update failed, updating in-memory store');
    }

    // Always update in-memory store
    const mem = inMemoryArticles.get(parsedId) || {};
    const updatedMem = {
      ...mem,
      ...body,
      id: parsedId,
      updatedAt: new Date()
    };
    if (body.tags && Array.isArray(body.tags)) {
      updatedMem.tags = body.tags.map((t: any, idx: number) => typeof t === 'string' ? { id: idx + 1, name: t, slug: t.toLowerCase() } : t);
    }
    inMemoryArticles.set(parsedId, updatedMem);

    return { 
      success: true, 
      article: updatedMem,
      tags: updatedMem.tags || []
    };
  });

  server.delete('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    
    try {
      const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
      if (existing.length > 0 && existing[0].imageUrl) {
        await deletePhysicalImage(existing[0].imageUrl);
      }
      await db.delete(articles).where(eq(articles.id, parsedId));
    } catch (e) {
      server.log.warn('DB delete failed, removing from in-memory store');
    }

    inMemoryArticles.delete(parsedId);
    return { success: true };
  });

  server.post('/api/articles/:id/image', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }

    const data = await request.file();
    if (!data) {
      reply.status(400).send({ error: 'No file uploaded' });
      return;
    }

    if (!data.mimetype.startsWith('image/')) {
      reply.status(400).send({ error: 'Only images are allowed' });
      return;
    }

    // Clean up old image if replacing
    const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
    if (existing.length > 0 && existing[0].imageUrl) {
      await deletePhysicalImage(existing[0].imageUrl);
    }

    const { pipeline } = await import('stream/promises');
    const fs = await import('fs');
    const path = await import('path');
    
    const ext = path.extname(data.filename) || '.jpg';
    const filename = `article_${parsedId}_${Date.now()}${ext}`;
    const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
    const filepath = path.join(IMAGES_DIR, filename);

    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    await pipeline(data.file, fs.createWriteStream(filepath));
    const imageUrl = `/images/${filename}`;

    await db.update(articles).set({ imageUrl }).where(eq(articles.id, parsedId));

    return { success: true, imageUrl };
  });

  server.delete('/api/articles/:id/image', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    
    const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
    if (existing.length > 0 && existing[0].imageUrl) {
      await deletePhysicalImage(existing[0].imageUrl);
    }

    await db.update(articles).set({ imageUrl: null }).where(eq(articles.id, parsedId));
    return { success: true };
  });

  server.post('/api/articles', async (request, reply) => {
    const body = request.body as any;
    
    if (!body.content || body.content.length < 10) {
      reply.status(400);
      return { success: false, error: 'Content (min 10 Zeichen) wird benötigt' };
    }

    const cleanContent = stripHtml(body.content);
    const finalTitle = body.title ? body.title : '[Auto-Titel ausstehend]';

    let createdArticle: any;
    try {
      const newArticle = await db.insert(articles).values({
        title: finalTitle,
        content: cleanContent,
        author: body.author || 'Unbekannt',
        category: body.category || 'Allgemein',
        status: body.status || 'draft'
      }).returning();

      createdArticle = newArticle[0];

      if (body.tags && Array.isArray(body.tags)) {
        await syncArticleTags(createdArticle.id, body.tags);
      } else if (body.tagIds && Array.isArray(body.tagIds)) {
        await syncArticleTags(createdArticle.id, body.tagIds);
      }

      const tagsMap = await getTagsForArticles([createdArticle.id]);
      createdArticle.tags = tagsMap.get(createdArticle.id) || [];
    } catch (e: any) {
      server.log.warn('DB insert failed, saving article in in-memory store');
      fallbackIdCounter++;
      const tagList = Array.isArray(body.tags)
        ? body.tags.map((t: any, idx: number) => typeof t === 'string' ? { id: idx + 1, name: t, slug: t.toLowerCase() } : t)
        : [];
      createdArticle = {
        id: fallbackIdCounter,
        title: finalTitle,
        content: cleanContent,
        teaser: body.teaser || (cleanContent.slice(0, 120) + '...'),
        keyTakeaways: body.keyTakeaways || null,
        author: body.author || 'Unbekannt',
        category: body.category || 'Allgemein',
        status: body.status || 'draft',
        imageUrl: body.imageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: tagList
      };
    }

    inMemoryArticles.set(createdArticle.id, createdArticle);
    return createdArticle;
  });

  server.post('/api/articles/quick', async (request, reply) => {
    const body = request.body as any;
    const text = body.text || body.content;
    
    if (!text || text.length < 10) {
      reply.status(400);
      return { success: false, error: 'Text min 10 Zeichen wird benötigt' };
    }

    const cleanContent = stripHtml(text);
    const generatedTitle = cleanContent.substring(0, 30) + '...';

    const newArticle = await db.insert(articles).values({
      title: generatedTitle,
      content: cleanContent,
      author: 'Quick API',
      category: 'Allgemein',
      status: 'published'
    }).returning();
    
    const articleId = newArticle[0].id;
    
    // Create job record in db first to get the auto-increment ID
    const newJob = await db.insert(jobs).values({
      articleId,
      type: 'teaser_generation',
      status: 'pending'
    }).returning();
    
    const dbJobId = newJob[0].id;
    
    // Automatically queue generation job
    let jobIdStr = `job-${dbJobId}`;
    try {
      const job = await generationQueue.add('teaser_generation', {
        articleId,
        jobId: dbJobId,
        type: 'teaser_generation'
      }, { jobId: jobIdStr });
      
      return { success: true, article: newArticle[0], jobId: job.id };
    } catch (error) {
      await db.update(jobs).set({ status: 'failed', error: String(error) }).where(eq(jobs.id, dbJobId));
      return { success: false, article: newArticle[0], jobId: jobIdStr, error: 'Job enqueuing failed' };
    }
  });
}
