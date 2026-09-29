import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '../utils/settings';

const VALID_KEYS = [
  'ollamaUrl', 'aiModel', 'embeddingModel', 'timeout', 'temperature', 'seed',
  'imageProvider', 'imageServerUrl', 'imageModel', 'imageTimeout', 'imagePromptModel', 'imagePromptThinking',
  'geminiModel', 'geminiImageSize'
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`${url} antwortet mit ${res.status}`);
  return res.json() as Promise<T>;
}

export default async function (server: FastifyInstance) {
  server.get('/api/settings', async () => getSettings());

  server.post('/api/settings', async (request) => {
    const body = request.body as Record<string, string>;

    for (const [key, value] of Object.entries(body)) {
      if (!VALID_KEYS.includes(key)) continue;

      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
    }

    return { success: true };
  });

  // Fragt Ollama und den Bildserver nach den installierten Modellen.
  // Ist ein Dienst aus, kommt statt einer erfundenen Liste eine Fehlermeldung.
  server.get('/api/settings/models', async () => {
    const config = await getSettings();
    const ollamaUrl = config.ollamaUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    const imageServerUrl = config.imageServerUrl || process.env.IMAGE_SERVER_URL || 'http://localhost:8080';

    const result = {
      textModels: [] as string[],
      imageModels: [] as string[],
      imageModelLabels: {} as Record<string, string>,
      errors: {} as Record<string, string>
    };

    try {
      const data = await fetchJson<{ models?: Array<{ name: string }> }>(`${ollamaUrl}/api/tags`);
      result.textModels = (data.models || []).map(m => m.name);
    } catch (err) {
      result.errors.ollama = `Ollama nicht erreichbar: ${err instanceof Error ? err.message : String(err)}`;
    }

    try {
      const data = await fetchJson<{ data?: Array<{ id: string; label?: string }> }>(`${imageServerUrl}/v1/models`);
      result.imageModels = (data.data || []).map(m => m.id);
      result.imageModelLabels = Object.fromEntries((data.data || []).map(m => [m.id, m.label || m.id]));
    } catch (err) {
      result.errors.imageServer = `Bildserver nicht erreichbar: ${err instanceof Error ? err.message : String(err)}`;
    }

    return { ...result, geminiKeySet: Boolean(process.env.GEMINI_API_KEY) };
  });
}
