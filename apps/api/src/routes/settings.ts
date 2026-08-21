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
    
    const validKeys = ['ollamaUrl', 'aiModel', 'timeout', 'imageModel'];
    
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
}
