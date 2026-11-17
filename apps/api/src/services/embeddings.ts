import { eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { articles } from '../db/schema';
import { getSettings } from '../utils/settings';
import { logger } from '../utils/logger';

export interface RelatedArticle {
  id: number;
  score: number;
}

// Ab dieser Kosinus-Aehnlichkeit gelten zwei Artikel als verwandt (bge-m3 / qwen3-embedding)
const RELATED_MIN_SCORE = 0.55;
const FALLBACK_RELATED_MIN_SCORE = 0.35;
const RELATED_LIMIT = 8;

/**
 * Berechnet ein Embedding ueber Ollama. bge-m3 ist mehrsprachig und kommt mit
 * deutschen Nachrichtentexten gut zurecht. Liefert null, wenn Ollama fehlt.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const settings = await getSettings();
  const ollamaUrl = settings['ollamaUrl'] || process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = settings['embeddingModel'] || 'bge-m3';

  try {
    const res = await fetch(`${ollamaUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text.slice(0, 6000) }),
      signal: AbortSignal.timeout(120000)
    });
    if (!res.ok) throw new Error(`Ollama antwortet mit ${res.status}`);
    const data = await res.json() as { embeddings?: number[][] };
    return data.embeddings?.[0] ?? null;
  } catch (err) {
    logger.warn(`Embedding fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

export async function updateArticleEmbedding(articleId: number): Promise<boolean> {
  const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
  if (!article) return false;
  const embedding = await embedText(`${article.title}\n\n${article.teaser || ''}\n\n${article.content}`);
  if (!embedding) return false;
  await db.update(articles).set({ embedding }).where(eq(articles.id, articleId));
  return true;
}

/** Ergaenzt fehlende Embeddings, z. B. fuer Artikel von vor der Einfuehrung. */
export async function backfillEmbeddings(): Promise<void> {
  const missing = await db.select({ id: articles.id }).from(articles).where(isNull(articles.embedding));
  for (const { id } of missing) {
    if (!(await updateArticleEmbedding(id))) return;
  }
  if (missing.length > 0) logger.info(`${missing.length} Embeddings nachgetragen`);
}

function normalize(v: number[]): number[] {
  const length = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)) || 1;
  return v.map((x) => x / length);
}

export interface RelatableArticle {
  id: number;
  embedding: number[] | null;
  category?: string;
  tags?: Array<{ slug?: string; name?: string }>;
  title?: string;
}

const tokenizeTitle = (title?: string): Set<string> => {
  if (!title) return new Set();
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4)
  );
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const item of a) if (b.has(item)) inter++;
  return inter / (a.size + b.size - inter);
};

/**
 * Liefert je Artikel die inhaltlich aehnlichsten anderen Artikel.
 * Nutzt Kosinus-Aehnlichkeit der Embeddings wenn vorhanden, und faellt bei
 * fehlendem Embedding (z. B. ohne laufendes Ollama) auf Tags/Kategorie/Titel zurueck.
 */
export function buildRelatedMap(items: RelatableArticle[]): Map<number, RelatedArticle[]> {
  const prepared = items.map((a) => ({
    id: a.id,
    v: Array.isArray(a.embedding) && a.embedding.length > 0 ? normalize(a.embedding) : null,
    category: (a.category || '').toLowerCase(),
    tags: new Set((a.tags || []).map((t) => (t.slug || t.name || '').toLowerCase()).filter(Boolean)),
    words: tokenizeTitle(a.title)
  }));

  const related = new Map<number, RelatedArticle[]>();
  for (const a of prepared) {
    const scores: RelatedArticle[] = [];
    for (const b of prepared) {
      if (a.id === b.id) continue;

      if (a.v && b.v && a.v.length === b.v.length) {
        let dot = 0;
        for (let i = 0; i < a.v.length; i++) dot += a.v[i]! * b.v[i]!;
        if (dot >= RELATED_MIN_SCORE) {
          scores.push({ id: b.id, score: Math.round(dot * 1000) / 1000 });
        }
        continue;
      }

      // Fallback ohne Embedding: Tag-Ueberlappung + gleiche Kategorie + Titelwoerter
      const tagSim = jaccard(a.tags, b.tags);
      const wordSim = jaccard(a.words, b.words);
      const sameCat = a.category && a.category === b.category ? 0.25 : 0;
      const fallbackScore = Math.min(0.85, tagSim * 0.65 + wordSim * 0.35 + sameCat);
      if (fallbackScore >= FALLBACK_RELATED_MIN_SCORE) {
        scores.push({ id: b.id, score: Math.round(fallbackScore * 1000) / 1000 });
      }
    }
    scores.sort((x, y) => y.score - x.score);
    related.set(a.id, scores.slice(0, RELATED_LIMIT));
  }
  return related;
}
