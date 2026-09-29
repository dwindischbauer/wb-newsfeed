import { getSettings } from '../utils/settings';
import { logger } from '../utils/logger';
import { autoExtractArticleMetadata, CATEGORY_SUBTAGS } from '../utils/metadata';

export interface SummaryResult {
  title: string;
  category: string;
  tags: string[];
  teaser: string;
  keyTakeaways: string;
  source: 'ai' | 'fallback';
  /** Model and sampling parameters used; null when the offline fallback ran. */
  generation: (GenerationOptions & { model: string }) | null;
}

export interface GenerationOptions {
  temperature: number;
  seed: number;
}

// Modelle liefern statt eines Strings manchmal ein Array, Kernpunkte werden dann zu Aufzaehlungen
function asText(value: unknown, asList: boolean): string {
  if (Array.isArray(value)) {
    const items = value.map((v) => String(v).trim().replace(/^[•\-*]\s*/, '')).filter(Boolean);
    return asList ? items.map((v) => `• ${v}`).join('\n') : items.join(' ');
  }
  return typeof value === 'string' ? value.trim() : '';
}

const CATEGORIES = Object.keys(CATEGORY_SUBTAGS);
const SUBTAG_NAMES = new Map(
  Object.values(CATEGORY_SUBTAGS).flat().map((t) => [t.name.toLowerCase(), t.name])
);

/** Behaelt nur Tags aus der festen Liste, hoechstens zwei. */
export function canonicalTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const names = raw
    .map((t) => SUBTAG_NAMES.get(String(t).trim().toLowerCase()))
    .filter((t): t is string => Boolean(t));
  return Array.from(new Set(names)).slice(0, 2);
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
 * teaser, key takeaways) - the same prompt used by the async job queue
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
  // Tags nur aus der festen Liste der Unterkategorien, damit keine Einzelfall-Tags
  // wie Firmen- oder Personennamen entstehen
  const tagsHint = Object.entries(CATEGORY_SUBTAGS)
    .map(([category, subtags]) => `${category}: ${subtags.map((t) => t.name).join(', ')}`)
    .join('\n');

  const promptText = `Du bist ein erfahrener Nachrichten-Redakteur. Analysiere den folgenden Artikel.
Antworte exakt im JSON Format mit folgenden Feldern:
- "title": Ein passender, kurzer, knackiger Titel für den Artikel (max. 60 Zeichen). Falls der aktuelle Titel nicht "[Auto-Titel ausstehend]" ist, kopiere den aktuellen Titel.
- "category": Ordne den Artikel genau einer dieser Kategorien zu: [${CATEGORIES.join(', ')}]. Auslandsnachrichten über Staaten, Konflikte und Regierungen gehören zu Politik, Kriminalität, Unfälle, Unwetter und Gesundheit zu Chronik. Falls die aktuelle Kategorie nicht "Auto" ist, kopiere die aktuelle Kategorie.
- "tags": Ein JSON-Array mit 1 oder 2 Unterkategorien, NUR aus dieser Liste und passend zur gewählten Kategorie. Keine anderen Begriffe, keine Namen:
${tagsHint}
- "teaser": Maximal 3 Sätze Zusammenfassung für einen Social-Media Newsfeed.
- "keyTakeaways": 3 wichtigste Stichpunkte als ein String, getrennt durch Bullet-Points (•).

Aktueller Titel: ${currentTitle}
Aktuelle Kategorie: ${currentCategory}

Hier ist der Artikel:
${content}`;

  try {
    const settingsMap = await getSettings();
    const ollamaUrl = settingsMap['ollamaUrl'] || process.env.OLLAMA_URL || 'http://localhost:11434';
    const aiModel = settingsMap['aiModel'] || 'qwen3:14b';
    // qwen3:14b braucht kalt geladen neben dem Bildserver teils ueber eine Minute
    const timeoutMs = parseInt(settingsMap['timeout'] || '180000', 10);
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
        // Teaser brauchen keine Denkphase, das spart bei qwen3 viel Zeit
        think: false,
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

    // Titel und Kategorie der Redaktion haben Vorrang, das Modell fuellt nur Platzhalter
    const finalTitle = currentTitle !== '[Auto-Titel ausstehend]' ? currentTitle : resultObj.title;
    const finalCategory = currentCategory !== 'Auto' && currentCategory !== 'Allgemein'
      ? currentCategory
      : CATEGORIES.includes(resultObj.category) ? resultObj.category : 'Chronik';

    const tagList = canonicalTags(resultObj.tags);

    return {
      title: finalTitle || 'Neuer Nachrichtenartikel',
      category: finalCategory && finalCategory !== 'Auto' ? finalCategory : 'Politik',
      tags: tagList,
      teaser: asText(resultObj.teaser, false),
      keyTakeaways: asText(resultObj.keyTakeaways, true),
      source: 'ai',
      generation: { model: aiModel, ...generationOptions }
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
      source: 'fallback',
      generation: null
    };
  }
}
