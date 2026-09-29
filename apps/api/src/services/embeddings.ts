import { eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { articles } from '../db/schema';
import { getSettings } from '../utils/settings';
import { logger } from '../utils/logger';

export interface RelatedArticle {
  id: number;
  score: number;
}

// Ab dieser Kosinus-Aehnlichkeit gelten zwei Artikel als verwandt (bge-m3)
const RELATED_MIN_SCORE = 0.55;
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

/**
 * Liefert je Artikel die inhaltlich aehnlichsten anderen Artikel.
 * Bei ein paar hundert Artikeln reicht der direkte Vergleich jeder mit jedem.
 */
export function buildRelatedMap(items: Array<{ id: number; embedding: number[] | null }>): Map<number, RelatedArticle[]> {
  const vectors = items
    .filter((a): a is { id: number; embedding: number[] } => Array.isArray(a.embedding) && a.embedding.length > 0)
    .map((a) => ({ id: a.id, v: normalize(a.embedding) }));

  const related = new Map<number, RelatedArticle[]>();
  for (const a of vectors) {
    const scores: RelatedArticle[] = [];
    for (const b of vectors) {
      if (a.id === b.id || a.v.length !== b.v.length) continue;
      let dot = 0;
      for (let i = 0; i < a.v.length; i++) dot += a.v[i]! * b.v[i]!;
      if (dot >= RELATED_MIN_SCORE) scores.push({ id: b.id, score: Math.round(dot * 1000) / 1000 });
    }
    scores.sort((x, y) => y.score - x.score);
    related.set(a.id, scores.slice(0, RELATED_LIMIT));
  }
  return related;
}
