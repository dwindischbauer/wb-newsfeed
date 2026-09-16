import type { FastifyInstance } from 'fastify';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  server.get('/api/settings', async (request, reply) => {
    const allSettings = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of allSettings) {
      result[row.key] = row.value;
    }
    return result;
  });

  server.post('/api/settings', async (request, reply) => {
    const body = request.body as Record<string, string>;
    
    const validKeys = ['ollamaUrl', 'aiModel', 'timeout', 'imageModel', 'localAiUrl', 'imageTimeout'];
    
    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      if (!validKeys.includes(key)) continue;
      
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
    }
    
    return { success: true };
  });

  server.get('/api/settings/models', async (request, reply) => {
    const allSettings = await db.select().from(settings);
    const configMap: Record<string, string> = {};
    for (const row of allSettings) {
      configMap[row.key] = row.value;
    }
    const ollamaUrl = configMap.ollamaUrl || 'http://localhost:11434';
    const localAiUrl = configMap.localAiUrl || 'http://localhost:8080';

    const defaultTextModels = [
      'llama3.1:8b-instruct-q4_0',
      'qwen2.5:3b-instruct',
      'llama3:8b',
      'mistral:7b',
      'phi3:mini'
    ];

    const defaultImageModels = [
      'stablediffusion',
      'stable-diffusion-3-medium',
      'flux.1-schnell',
      'x/z-image-turbo'
    ];

    let textModels = [...defaultTextModels];
    let imageModels = [...defaultImageModels];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json() as { models?: Array<{ name: string }> };
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          const names = data.models.map(m => m.name);
          textModels = Array.from(new Set([...names, ...defaultTextModels]));
        }
      }
    } catch {
      // Ollama not reachable, fall back to defaults
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${localAiUrl}/models`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json() as { data?: Array<{ id: string }> };
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const ids = data.data.map(m => m.id);
          imageModels = Array.from(new Set([...ids, ...defaultImageModels]));
        }
      }
    } catch {
      // LocalAI not reachable, fall back to defaults
    }

    return { textModels, imageModels };
  });
}
