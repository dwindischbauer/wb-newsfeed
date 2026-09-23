import type { FastifyInstance } from 'fastify';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from '../db';
import { articles, tags, articleTags, generationVersions } from '../db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { stripHtml } from '../utils/format';
import { enqueueGeneration } from '../queue';
import { listGenerationVersions, recordGenerationVersion } from '../services/versions';
import { autoExtractArticleMetadata } from '../utils/metadata';
import { generateArticleImage } from '../services/imageGenerator';

type ArticleRecord = InferSelectModel<typeof articles>;

export interface ArticleTagRef {
  id: number;
  name: string;
  slug: string;
  color?: string | null;
}

export interface StoredArticle extends ArticleRecord {
  tags: ArticleTagRef[];
}

type TagInput = string | ArticleTagRef | { name: string };

const tagInputName = (t: TagInput): string => (typeof t === 'string' ? t : t.name);

interface ArticleBody {
  id?: number;
  title?: string;
  content?: string;
  teaser?: string;
  keyTakeaways?: string;
  author?: string;
  category?: string;
  status?: string;
  imageUrl?: string | null;
  tags?: TagInput[];
  tagIds?: number[];
  /** POST only: set to false to skip the automatic AI teaser generation. */
  generate?: boolean;
}

async function getTagsForArticles(articleIds: number[]): Promise<Map<number, ArticleTagRef[]>> {
  const map = new Map<number, ArticleTagRef[]>();
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
      if (existing.length > 0 && existing[0]) {
        tagId = existing[0].id;
      } else {
        const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `tag-${Date.now()}`;
        const created = await db.insert(tags).values({ name: trimmed, slug }).returning();
        tagId = created[0]?.id ?? null;
      }
    }

    if (tagId) {
      try {
        await db.insert(articleTags).values({ articleId, tagId }).onConflictDoNothing();
      } catch {
        // duplicate article-tag pair — already linked, ignore
      }
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
  } catch {
    // Ignore if file doesn't exist or already removed
  }
}

// Resilient In-Memory store for offline/demo reliability
let fallbackIdCounter = 100;
export const inMemoryArticles: Map<number, StoredArticle> = new Map();

const defaultSeedArticles: StoredArticle[] = [
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
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
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
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
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
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createdAt: new Date('2026-09-16T09:30:00Z'),
    updatedAt: new Date('2026-09-16T09:30:00Z'),
    tags: [{ id: 6, name: 'Wirtschaft', slug: 'wirtschaft' }, { id: 7, name: 'Finanzen', slug: 'finanzen' }]
  }
];

for (const a of defaultSeedArticles) {
  inMemoryArticles.set(a.id, a);
}

export default async function (server: FastifyInstance) {
  server.get('/api/articles', async (request) => {
    const query = request.query as { tag?: string; category?: string };

    let result: StoredArticle[] = [];
    try {
      const allArticles = await db.select().from(articles).orderBy(desc(articles.createdAt));
      const articleIds = allArticles.map((a) => a.id);
      const tagsMap = await getTagsForArticles(articleIds);

      result = allArticles.map((a) => ({
        ...a,
        content: stripHtml(a.content),
        tags: tagsMap.get(a.id) || []
      }));
      for (const item of result) {
        inMemoryArticles.set(item.id, item);
      }
    } catch {
      server.log.warn('Database offline, reading from in-memory fallback store');
      result = Array.from(inMemoryArticles.values()).sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }

    if (query.tag) {
      const filterTag = query.tag.toLowerCase();
      result = result.filter((a) => a.tags && a.tags.some((t) => (t.slug || t.name || '').toLowerCase() === filterTag));
    }
    if (query.category && query.category !== 'Alle') {
      result = result.filter((a) => a.category && a.category.toLowerCase() === query.category?.toLowerCase());
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
      if (articleRes.length > 0 && articleRes[0]) {
        const tagsMap = await getTagsForArticles([parsedId]);
        const res: StoredArticle = {
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
    const body = request.body as ArticleBody;
    const parsedId = parseInt(id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }

    let generationJobId: number | null = null;
    try {
      const existing = await db.select().from(articles).where(eq(articles.id, parsedId));
      const before = existing[0];
      if (before) {
        const updateData: Partial<Pick<ArticleRecord, 'status' | 'title' | 'category' | 'content' | 'teaser' | 'keyTakeaways' | 'author'>> = {};
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

        // A hand-edited teaser becomes a 'manual' version. Otherwise, changed
        // content makes the stored teaser stale, so regenerate it asynchronously.
        const teaserEdited = (body.teaser !== undefined && body.teaser !== before.teaser)
          || (body.keyTakeaways !== undefined && body.keyTakeaways !== before.keyTakeaways);
        const contentChanged = body.content !== undefined && body.content !== before.content;
        if (teaserEdited) {
          await recordGenerationVersion({
            articleId: parsedId,
            content: updateData.content ?? before.content,
            title: updateData.title ?? before.title,
            category: updateData.category ?? before.category,
            teaser: updateData.teaser ?? before.teaser,
            keyTakeaways: updateData.keyTakeaways ?? before.keyTakeaways,
            source: 'manual'
          });
        } else if (contentChanged) {
          const { jobId } = await enqueueGeneration(parsedId, 'teaser_generation', { trigger: 'content_changed' });
          generationJobId = jobId;
        }

        if (body.tags !== undefined && Array.isArray(body.tags)) {
          await syncArticleTags(parsedId, body.tags.map(tagInputName));
        } else if (body.tagIds !== undefined && Array.isArray(body.tagIds)) {
          await syncArticleTags(parsedId, body.tagIds);
        }
      }
    } catch {
      server.log.warn('DB update failed, updating in-memory store');
    }

    // Always update in-memory store
    const mem = inMemoryArticles.get(parsedId);
    const updatedMem: StoredArticle = {
      ...(mem as StoredArticle),
      ...body,
      id: parsedId,
      updatedAt: new Date(),
      tags: mem?.tags || []
    };
    if (body.tags && Array.isArray(body.tags)) {
      updatedMem.tags = body.tags.map((t, idx) =>
        typeof t === 'string' ? { id: idx + 1, name: t, slug: t.toLowerCase() } : { id: idx + 1, slug: t.name.toLowerCase(), ...t }
      );
    }
    inMemoryArticles.set(parsedId, updatedMem);

    return {
      success: true,
      article: updatedMem,
      tags: updatedMem.tags || [],
      generationJobId
    };
  });

  server.get('/api/articles/:id/versions', async (request, reply) => {
    const parsedId = parseInt((request.params as { id: string }).id);
    if (Number.isNaN(parsedId)) {
      reply.status(400).send({ error: 'Invalid article ID' });
      return;
    }
    return listGenerationVersions(parsedId);
  });

  // Restoring copies an old version back onto the article and appends it as a
  // new version (restoredFrom = old number), so history is never rewritten.
  server.post('/api/articles/:id/versions/:version/restore', async (request, reply) => {
    const params = request.params as { id: string; version: string };
    const parsedId = parseInt(params.id);
    const versionNo = parseInt(params.version);
    if (Number.isNaN(parsedId) || Number.isNaN(versionNo)) {
      reply.status(400).send({ error: 'Invalid article ID or version' });
      return;
    }

    const [old] = await db.select().from(generationVersions)
      .where(and(eq(generationVersions.articleId, parsedId), eq(generationVersions.version, versionNo)));
    const [article] = await db.select().from(articles).where(eq(articles.id, parsedId));
    if (!old || !article) {
      reply.status(404).send({ error: 'Version not found' });
      return;
    }

    await db.update(articles).set({ teaser: old.teaser, keyTakeaways: old.keyTakeaways }).where(eq(articles.id, parsedId));
    const created = await recordGenerationVersion({
      articleId: parsedId,
      content: article.content,
      title: article.title,
      category: article.category,
      teaser: old.teaser,
      keyTakeaways: old.keyTakeaways,
      tags: old.tags ? (JSON.parse(old.tags) as string[]) : undefined,
      source: old.source as 'ai' | 'fallback' | 'manual',
      generation: old.model && old.temperature !== null && old.seed !== null
        ? { model: old.model, temperature: old.temperature, seed: old.seed }
        : null,
      restoredFrom: old.version
    });

    const mem = inMemoryArticles.get(parsedId);
    if (mem) inMemoryArticles.set(parsedId, { ...mem, teaser: old.teaser, keyTakeaways: old.keyTakeaways, updatedAt: new Date() });

    return { success: true, version: created };
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
      if (existing.length > 0 && existing[0]?.imageUrl) {
        await deletePhysicalImage(existing[0].imageUrl);
      }
      await db.delete(articles).where(eq(articles.id, parsedId));
    } catch {
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
    if (existing.length > 0 && existing[0]?.imageUrl) {
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
    if (existing.length > 0 && existing[0]?.imageUrl) {
      await deletePhysicalImage(existing[0].imageUrl);
    }

    await db.update(articles).set({ imageUrl: null }).where(eq(articles.id, parsedId));
    return { success: true };
  });

  server.post('/api/articles/auto-extract', async (request, reply) => {
    const body = request.body as { content?: string; category?: string };
    if (!body || !body.content || body.content.length < 5) {
      return reply.status(400).send({ error: 'Content is required' });
    }
    const meta = autoExtractArticleMetadata(body.content, body.category);
    return { success: true, ...meta };
  });

  server.post('/api/articles/:id/generate-image', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return reply.status(400).send({ error: 'Invalid article ID' });
    }

    let article: StoredArticle | null = null;
    try {
      const dbRes = await db.select().from(articles).where(eq(articles.id, parsedId));
      if (dbRes.length > 0 && dbRes[0]) {
        const tagsMap = await getTagsForArticles([parsedId]);
        article = { ...dbRes[0], tags: tagsMap.get(parsedId) || [] };
      }
    } catch {
      // fall through to in-memory lookup
    }

    if (!article) {
      article = inMemoryArticles.get(parsedId) || null;
    }

    if (!article) {
      return reply.status(404).send({ error: 'Article not found' });
    }

    const reqBody = (request.body as { mode?: string }) || {};
    const reqQuery = (request.query as { mode?: string }) || {};
    const mode: 'editorial' | 'ai' = (reqBody.mode || reqQuery.mode) === 'ai' ? 'ai' : 'editorial';

    const tagNames = (article.tags || []).map(tagInputName);
    const imageUrl = await generateArticleImage(
      article.title,
      article.category,
      parsedId,
      article.teaser ?? undefined,
      tagNames,
      mode
    );

    if (!imageUrl) {
      return reply.status(500).send({ success: false, error: 'Failed to generate image' });
    }

    try {
      await db.update(articles).set({ imageUrl }).where(eq(articles.id, parsedId));
    } catch {
      // best-effort — in-memory store below still gets the new image
    }

    const mem = inMemoryArticles.get(parsedId) || article;
    const updatedMem: StoredArticle = { ...mem, imageUrl, updatedAt: new Date() };
    inMemoryArticles.set(parsedId, updatedMem);

    return { success: true, imageUrl, article: updatedMem };
  });

  server.post('/api/articles', async (request, reply) => {
    const body = request.body as ArticleBody;

    if (!body.content || body.content.length < 10) {
      reply.status(400);
      return { success: false, error: 'Content (min 10 Zeichen) wird benötigt' };
    }

    const cleanContent = stripHtml(body.content);

    // Auto-extract metadata if title, category or tags are missing
    const extracted = autoExtractArticleMetadata(cleanContent, body.category);
    const finalTitle = (body.title && body.title.trim() && body.title !== '[Auto-Titel ausstehend]')
      ? body.title.trim()
      : extracted.title;
    const finalCategory = (body.category && body.category !== 'Auto' && body.category !== 'Allgemein')
      ? body.category
      : extracted.category;
    const finalTeaser = body.teaser || extracted.teaser;
    const finalTakeaways = body.keyTakeaways || extracted.keyTakeaways;
    const finalTags: TagInput[] = (body.tags && Array.isArray(body.tags) && body.tags.length > 0)
      ? body.tags
      : extracted.tags.map((t) => t.name);

    let createdArticle: StoredArticle;
    let generationJobId: number | null = null;
    try {
      const newArticle = await db.insert(articles).values({
        title: finalTitle,
        content: cleanContent,
        teaser: finalTeaser,
        keyTakeaways: finalTakeaways,
        author: body.author || 'Unbekannt',
        category: finalCategory,
        status: body.status || 'draft'
      }).returning();

      const inserted = newArticle[0];
      if (!inserted) throw new Error('Insert returned no row');

      if (finalTags.length > 0) {
        await syncArticleTags(inserted.id, finalTags.map(tagInputName));
      } else if (body.tagIds && Array.isArray(body.tagIds)) {
        await syncArticleTags(inserted.id, body.tagIds);
      }

      const tagsMap = await getTagsForArticles([inserted.id]);
      createdArticle = { ...inserted, tags: tagsMap.get(inserted.id) || [] };

      // New content is generated server-side, so any client (not only the admin)
      // gets an AI teaser. A teaser sent by the client is kept as a manual version.
      if (body.teaser) {
        await recordGenerationVersion({
          articleId: inserted.id,
          content: cleanContent,
          title: finalTitle,
          category: finalCategory,
          teaser: finalTeaser,
          keyTakeaways: finalTakeaways,
          source: 'manual'
        });
      } else if (body.generate !== false) {
        const { jobId } = await enqueueGeneration(inserted.id, 'teaser_generation', {
          autoTitle: !(body.title && body.title.trim() && body.title !== '[Auto-Titel ausstehend]'),
          autoCategory: !(body.category && body.category !== 'Auto' && body.category !== 'Allgemein'),
          trigger: 'created'
        });
        generationJobId = jobId;
      }
    } catch {
      server.log.warn('DB insert failed, saving article in in-memory store');
      fallbackIdCounter++;
      const tagList: ArticleTagRef[] = finalTags.map((t, idx) =>
        typeof t === 'string' ? { id: idx + 1, name: t, slug: t.toLowerCase() } : { id: idx + 1, slug: t.name.toLowerCase(), ...t }
      );
      createdArticle = {
        id: fallbackIdCounter,
        title: finalTitle,
        content: cleanContent,
        teaser: finalTeaser,
        keyTakeaways: finalTakeaways,
        author: body.author || 'Unbekannt',
        category: finalCategory,
        status: body.status || 'draft',
        imageUrl: body.imageUrl || null,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: tagList
      };
    }

    inMemoryArticles.set(createdArticle.id, createdArticle);
    return { ...createdArticle, generationJobId };
  });

  server.post('/api/articles/quick', async (request, reply) => {
    const body = request.body as { text?: string; content?: string };
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

    const inserted = newArticle[0];
    if (!inserted) {
      reply.status(500);
      return { success: false, error: 'Insert fehlgeschlagen' };
    }
    // Title/category are placeholders here, so the model may replace them
    const { jobId, queued } = await enqueueGeneration(inserted.id, 'teaser_generation', {
      autoTitle: true,
      autoCategory: true,
      trigger: 'created'
    });
    const jobIdStr = `job-${jobId}`;
    return queued
      ? { success: true, article: inserted, jobId: jobIdStr }
      : { success: false, article: inserted, jobId: jobIdStr, error: 'Job enqueuing failed' };
  });

  // Synchronous article creation: takes raw content, runs it straight through
  // AI summarization (title/category/tags/teaser/keyTakeaways) and, optionally,
  // cover image generation, then returns everything in one response — no job
  // polling required. Same inputs/behaviour as creating an article in the
  // admin dashboard, just synchronous and API-first.
  server.post('/api/articles/generate', async (request, reply) => {
    const body = (request.body as ArticleBody & { generateImage?: boolean | string; imageMode?: string }) || {};
    const content = body.content;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      reply.status(400);
      return { success: false, error: 'content (min. 10 Zeichen) wird benötigt' };
    }

    const generateImage = body.generateImage === true || body.generateImage === 'true';
    const imageMode: 'editorial' | 'ai' = body.imageMode === 'ai' ? 'ai' : 'editorial';
    const cleanContent = stripHtml(content);
    const requestedTitle = (body.title && body.title.trim()) || '[Auto-Titel ausstehend]';
    const requestedCategory = (body.category && body.category.trim()) || 'Auto';

    const { summarizeArticle } = await import('../services/summarizer');
    const summary = await summarizeArticle(cleanContent, requestedTitle, requestedCategory);

    const finalTags: TagInput[] = (body.tags && Array.isArray(body.tags) && body.tags.length > 0)
      ? body.tags
      : summary.tags;

    let createdArticle: StoredArticle;
    try {
      const inserted = await db.insert(articles).values({
        title: summary.title,
        content: cleanContent,
        teaser: summary.teaser,
        keyTakeaways: summary.keyTakeaways,
        author: body.author || 'API',
        category: summary.category,
        status: body.status || 'published'
      }).returning();

      const row = inserted[0];
      if (!row) throw new Error('Insert returned no row');
      await syncArticleTags(row.id, finalTags.map(tagInputName));
      await recordGenerationVersion({
        articleId: row.id,
        content: cleanContent,
        title: summary.title,
        category: summary.category,
        teaser: summary.teaser,
        keyTakeaways: summary.keyTakeaways,
        tags: summary.tags,
        source: summary.source,
        generation: summary.generation
      });
      createdArticle = { ...row, tags: [] };
    } catch (e) {
      reply.status(500);
      const message = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Konnte Artikel nicht anlegen: ${message}` };
    }

    let imagePath: string | null = null;
    if (generateImage) {
      const tagNames = finalTags.map(tagInputName);
      imagePath = await generateArticleImage(
        createdArticle.title,
        createdArticle.category,
        createdArticle.id,
        createdArticle.teaser ?? undefined,
        tagNames,
        imageMode
      );
      if (imagePath) {
        await db.update(articles).set({ imageUrl: imagePath }).where(eq(articles.id, createdArticle.id));
      }
    }

    const tagsMap = await getTagsForArticles([createdArticle.id]);
    const finalArticleTags = tagsMap.get(createdArticle.id) || [];
    inMemoryArticles.set(createdArticle.id, { ...createdArticle, imageUrl: imagePath, tags: finalArticleTags });

    return {
      success: true,
      article: {
        ...createdArticle,
        imageUrl: imagePath,
        tags: finalArticleTags
      },
      imagePath,
      summary: {
        teaser: summary.teaser,
        keyTakeaways: summary.keyTakeaways,
        source: summary.source
      }
    };
  });
}
