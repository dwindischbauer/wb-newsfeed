import { createHash } from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { generationVersions } from '../db/schema';
import type { SummaryResult } from './summarizer';

export type VersionSource = 'ai' | 'fallback' | 'manual';

export interface VersionInput {
  articleId: number;
  content: string;
  title?: string | null;
  category?: string | null;
  teaser?: string | null;
  keyTakeaways?: string | null;
  tags?: string[];
  source: VersionSource;
  generation?: SummaryResult['generation'];
  jobId?: number | null;
  restoredFrom?: number | null;
}

/** SHA-256 of the article body the version was generated from. */
export const hashContent = (content: string): string =>
  createHash('sha256').update(content).digest('hex');

/**
 * Appends an immutable version for an article. The version number is computed
 * in the same statement (max + 1); the unique (article_id, version) constraint
 * guards against two concurrent inserts getting the same number.
 */
export async function recordGenerationVersion(input: VersionInput) {
  const nextVersion = sql<number>`(select coalesce(max(${generationVersions.version}), 0) + 1 from ${generationVersions} where ${generationVersions.articleId} = ${input.articleId})`;
  const [row] = await db.insert(generationVersions).values({
    articleId: input.articleId,
    version: nextVersion,
    title: input.title ?? null,
    category: input.category ?? null,
    teaser: input.teaser ?? null,
    keyTakeaways: input.keyTakeaways ?? null,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    source: input.source,
    model: input.generation?.model ?? null,
    temperature: input.generation?.temperature ?? null,
    seed: input.generation?.seed ?? null,
    contentHash: hashContent(input.content),
    jobId: input.jobId ?? null,
    restoredFrom: input.restoredFrom ?? null
  }).returning();
  return row;
}

export async function listGenerationVersions(articleId: number) {
  const rows = await db
    .select()
    .from(generationVersions)
    .where(eq(generationVersions.articleId, articleId))
    .orderBy(desc(generationVersions.version));
  return rows.map((r) => ({ ...r, tags: r.tags ? (JSON.parse(r.tags) as string[]) : [] }));
}
