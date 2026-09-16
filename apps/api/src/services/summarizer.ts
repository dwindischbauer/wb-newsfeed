import { db } from '../db';
import { tags } from '../db/schema';
import { getSettings } from '../utils/settings';
import { logger } from '../utils/logger';
import { autoExtractArticleMetadata } from '../utils/metadata';

export interface SummaryResult {
  title: string;
  category: string;
  tags: string[];
  teaser: string;
  keyTakeaways: string;
  source: 'ai' | 'fallback';
}

/**
 * Summarizes an article with the local Ollama LLM (title, category, tags,
 * teaser, key takeaways) with an offline fallback.
 */
export async function summarizeArticle(
  content: string,
  currentTitle: string = '[Auto-Titel ausstehend]',
  currentCategory: string = 'Auto'
): Promise<SummaryResult> {
  const existingTags = await db.select().from(tags).catch(() => []);
  const existingTagNames = existingTags.map(t => t.name);
  const tagsHint = existingTagNames.length > 0
    ? `[${existingTagNames.join(', ')}]`
    : '[Innenpolitik, Außenpolitik, Wirtschaft, Technologie, Kultur, Sport, Chronik, Klima]';

  const promptText = `Du bist ein erfahrener Nachrichten-Redakteur. Analysiere den folgenden Artikel.
Antworte exakt im JSON Format mit folgenden Feldern:
- "title": Ein passender, kurzer, knackiger Titel für den Artikel (max. 60 Zeichen). Falls der aktuelle Titel nicht "[Auto-Titel ausstehend]" ist, kopiere den aktuellen Titel.
- "category": Ordne den Artikel genau einer dieser Kategorien zu: [Politik, Wirtschaft, Sport, Technologie, Kultur]. Falls die aktuelle Kategorie nicht "Auto" ist, kopiere die aktuelle Kategorie.
- "tags": Ein JSON-Array mit 1 bis 3 passenden Schlagwörtern (z.B. ["Innenpolitik", "Nationalrat"] oder ["Außenpolitik", "Diplomatie"]). Wähle nach Möglichkeit aus den bestehenden Tags: ${tagsHint}.
- "teaser": Maximal 3 Sätze Zusammenfassung für einen Social-Media Newsfeed.
- "keyTakeaways": 3 wichtigste Stichpunkte als ein String, getrennt durch Bullet-Points (•).

Aktueller Titel: ${currentTitle}
Aktuelle Kategorie: ${currentCategory}

Hier ist der Artikel:
${content}`;

  const extracted = autoExtractArticleMetadata(content, currentCategory);
  return {
    title: currentTitle !== '[Auto-Titel ausstehend]' ? currentTitle : extracted.title,
    category: currentCategory !== 'Auto' ? currentCategory : extracted.category,
    tags: extracted.tags.map(t => t.name),
    teaser: extracted.teaser,
    keyTakeaways: extracted.keyTakeaways,
    source: 'fallback'
  };
}
