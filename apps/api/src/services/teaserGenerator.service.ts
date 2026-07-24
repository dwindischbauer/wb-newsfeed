import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';

export interface TeaserResult {
  headline: string;
  summary: string;
  keyTakeaways: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  language: string;
  modelUsed: string;
}

export interface TeaserGeneratorInterface {
  generateTeaser(title: string, content: string): Promise<TeaserResult>;
}

export class OllamaTeaserGenerator implements TeaserGeneratorInterface {
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = env.OLLAMA_BASE_URL;
    this.model = env.OLLAMA_MODEL;
    this.timeoutMs = env.LLM_TIMEOUT_MS;
  }

  async generateTeaser(title: string, content: string): Promise<TeaserResult> {
    const prompt = `Du bist ein professioneller Redakteur für ein Nachrichtenportal. Erstelle aus dem folgenden Artikel eine kurze Zusammenfassung für ein mobiles Newsfeed-Modul.

Titel: ${title}
Inhalt: ${content}

Antworte AUSSCHLIESSLICH im gültigen JSON-Format mit dieser Exakten Struktur:
{
  "headline": "Prägnante Schlagzeile (max. 10 Wörter)",
  "summary": "Kurzer Teaser-Text (1-2 Sätze, ca. 20-30 Wörter)",
  "keyTakeaways": ["Kernpunkt 1", "Kernpunkt 2"],
  "sentiment": "neutral",
  "category": "Politik"
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      logger.info({ model: this.model }, 'Sending request to Ollama LLM endpoint');

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error with status: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as { response: string };
      const parsed = JSON.parse(data.response) as Partial<TeaserResult>;

      return {
        headline: parsed.headline || title,
        summary: parsed.summary || content.substring(0, 150) + '...',
        keyTakeaways: parsed.keyTakeaways || [],
        sentiment: parsed.sentiment || 'neutral',
        category: parsed.category || 'Politik',
        language: 'de',
        modelUsed: this.model,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn({ errorMsg }, 'Ollama LLM call failed or timed out. Falling back to deterministic teaser generation');
      
      return {
        headline: title,
        summary: content.length > 180 ? content.substring(0, 177) + '...' : content,
        keyTakeaways: ['Automatisch generierte Zusammenfassung'],
        sentiment: 'neutral',
        category: 'Politik',
        language: 'de',
        modelUsed: `${this.model}-fallback`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
