import { XMLParser } from 'fast-xml-parser';
import { inArray } from 'drizzle-orm';
import { db } from '../db';
import { articles } from '../db/schema';
import { enqueueGeneration, newArticleGenerationType } from '../queue';
import { logger } from '../utils/logger';

export interface ImportOptions {
  /** Maximal so viele neue Artikel anlegen */
  limit?: number;
  /** Artikelseite laden und den Fliesstext uebernehmen (sonst nur die Beschreibung aus dem Feed) */
  fullText?: boolean;
  status?: 'draft' | 'published';
  /** Autor-Feld, Standard ist der Titel des Feeds */
  author?: string;
}

export interface ImportResult {
  source: string;
  found: number;
  imported: Array<{ id: number; title: string; jobId: number }>;
  skipped: number;
}

interface FeedItem {
  title: string;
  link: string;
  description: string;
  date: Date | null;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });

const text = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) return String((value as Record<string, unknown>)['#text']);
  return String(value);
};

const asArray = <T>(value: T | T[] | undefined): T[] => (value == null ? [] : Array.isArray(value) ? value : [value]);

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

const stripTags = (html: string): string => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Liest RSS 2.0, RSS 1.0 (RDF, z. B. ORF) und Atom. */
export function parseFeed(xml: string): { title: string; items: FeedItem[] } {
  const doc = parser.parse(xml);

  const channel = doc.rss?.channel ?? doc['rdf:RDF']?.channel ?? doc.feed;
  const rawItems = asArray(doc.rss?.channel?.item ?? doc['rdf:RDF']?.item ?? doc.feed?.entry);

  const items = rawItems.map((item: Record<string, unknown>) => {
    const atomLink = asArray(item.link as Record<string, string> | Record<string, string>[]).find((l) => typeof l === 'object' && l['@_href']);
    const link = typeof item.link === 'string' ? item.link : atomLink?.['@_href'] ?? text(item.link);
    const dateRaw = text(item.pubDate ?? item['dc:date'] ?? item.published ?? item.updated);
    const date = dateRaw ? new Date(dateRaw) : null;
    return {
      title: stripTags(text(item.title)),
      link: link.trim(),
      description: stripTags(text(item.description ?? item.summary ?? item['content:encoded'])),
      date: date && !Number.isNaN(date.getTime()) ? date : null
    };
  });

  return { title: stripTags(text(channel?.title)) || 'Import', items: items.filter((i) => i.title && i.link) };
}

/**
 * Holt den Fliesstext einer Artikelseite: die Absaetze im Hauptinhalt.
 * Sucht zuerst nach typischen Containern (article, main, *content*),
 * Kaesten mit Verschachtelung und sehr kurze Zeilen fallen weg.
 */
export function extractArticleText(html: string): string {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const containers = [
    /<div[^>]+class="[^"]*story-content[^"]*"[^>]*>([\s\S]*?)<div[^>]+class="[^"]*story-footer/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i
  ];
  let segment = body;
  for (const re of containers) {
    const match = body.match(re);
    if (match?.[1] && match[1].length > 500) {
      segment = match[1];
      break;
    }
  }

  const blocks: string[] = [];
  for (const m of segment.matchAll(/<(p|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const inner = m[2] ?? '';
    if (/<(div|section|figure|ul)\b/i.test(inner)) continue;
    const line = stripTags(inner);
    const isHeading = m[1] !== 'p';
    if ((isHeading && line.length >= 8) || line.length >= 60) blocks.push(line);
  }
  return blocks.join('\n\n');
}

export async function importFeed(url: string, options: ImportOptions = {}): Promise<ImportResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'wb-newsfeed-importer' } });
  if (!res.ok) throw new Error(`Feed antwortet mit ${res.status}`);
  const feed = parseFeed(await res.text());

  const links = feed.items.map((i) => i.link);
  const known = links.length
    ? new Set((await db.select({ url: articles.sourceUrl }).from(articles).where(inArray(articles.sourceUrl, links))).map((r) => r.url))
    : new Set<string | null>();

  const result: ImportResult = { source: feed.title, found: feed.items.length, imported: [], skipped: 0 };
  const generationType = await newArticleGenerationType();

  for (const item of feed.items) {
    if (result.imported.length >= limit) break;
    if (known.has(item.link)) {
      result.skipped++;
      continue;
    }

    let content = item.description;
    if (options.fullText) {
      try {
        const page = await fetch(item.link, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'wb-newsfeed-importer' } });
        if (page.ok) {
          const body = extractArticleText(await page.text());
          if (body.length > content.length) content = item.description ? `${item.description}\n\n${body}` : body;
        }
      } catch (err) {
        logger.warn(`Volltext fuer ${item.link} nicht geladen: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Zu kurze Meldungen (z. B. reine Ticker-Zeilen) ergeben keinen sinnvollen Teaser
    if (content.length < 200) {
      result.skipped++;
      continue;
    }

    const [row] = await db.insert(articles).values({
      title: item.title,
      content,
      category: 'Auto',
      author: options.author || feed.title,
      status: options.status || 'published',
      sourceUrl: item.link,
      ...(item.date ? { createdAt: item.date } : {})
    }).returning();
    if (!row) continue;

    // Kategorie und Tags bestimmt das Sprachmodell, der Titel der Quelle bleibt
    const { jobId } = await enqueueGeneration(row.id, generationType, { autoCategory: true, trigger: 'import' });
    result.imported.push({ id: row.id, title: row.title, jobId });
  }

  logger.info(`Import ${feed.title}: ${result.imported.length} neu, ${result.skipped} uebersprungen`);
  return result;
}
