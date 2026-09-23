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

export interface GenerationOptions {
  temperature: number;
  seed: number;
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = { temperature: 0, seed: 42 };

/**
 * Sampling parameters for Ollama, read from the settings table. A fixed seed
 * plus temperature 0 makes the same model + prompt produce the same output,
 * so generated teasers are reproducible. Invalid values fall back to defaults.
 */
export function getGenerationOptions(settingsMap: Record<string, string>): GenerationOptions {
  const temperature = Number.parseFloat(settingsMap['temperature'] ?? '');
  const seed = Number.parseInt(settingsMap['seed'] ?? '', 10);
  return {
    temperature: Number.isFinite(temperature) && temperature >= 0 && temperature <= 2
      ? temperature
      : DEFAULT_GENERATION_OPTIONS.temperature,
    seed: Number.isInteger(seed) ? seed : DEFAULT_GENERATION_OPTIONS.seed
  };
}

/**
 * Summarizes an article with the local Ollama LLM (title, category, tags,
 * teaser, key takeaways) — the same prompt used by the async job queue
 * (queue/index.ts), just called synchronously. Falls back to the offline
 * keyword-based extractor (utils/metadata.ts) if Ollama is unreachable,
 * times out, or returns something unparsable, so the caller always gets a
 * usable result.
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

  try {
    const settingsMap = await getSettings();
    const ollamaUrl = settingsMap['ollamaUrl'] || process.env.OLLAMA_URL || 'http://localhost:11434';
    const aiModel = settingsMap['aiModel'] || 'qwen2.5:3b-instruct';
    const timeoutMs = parseInt(settingsMap['timeout'] || '60000', 10);
    const generationOptions = getGenerationOptions(settingsMap);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiModel,
        prompt: promptText,
        stream: false,
        format: 'json',
        options: generationOptions
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const resultObj = JSON.parse(data.response);

    const finalTitle = resultObj.title && resultObj.title !== '[Auto-Titel ausstehend]'
      ? resultObj.title
      : (currentTitle !== '[Auto-Titel ausstehend]' ? currentTitle : resultObj.title);
    const finalCategory = resultObj.category && resultObj.category !== 'Auto'
      ? resultObj.category
      : currentCategory;

    const tagList: string[] = Array.isArray(resultObj.tags)
      ? resultObj.tags.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
      : [];

    return {
      title: finalTitle || 'Neuer Nachrichtenartikel',
      category: finalCategory && finalCategory !== 'Auto' ? finalCategory : 'Politik',
      tags: tagList,
      teaser: resultObj.teaser || '',
      keyTakeaways: resultObj.keyTakeaways || '',
      source: 'ai'
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`AI summarization failed, using offline fallback: ${message}`);
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
}
