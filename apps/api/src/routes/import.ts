import type { FastifyInstance } from 'fastify';
import { importFeed } from '../services/importer';

export default async function (server: FastifyInstance) {
  // Importiert Artikel aus einem RSS- oder Atom-Feed. Jeder neue Artikel
  // bekommt einen full_generation-Job (Teaser, Kategorie, Tags, Bild).
  server.post('/api/import/rss', async (request, reply) => {
    const body = (request.body as { url?: string; limit?: number; fullText?: boolean; status?: 'draft' | 'published'; author?: string }) || {};
    if (!body.url || !/^https?:\/\//.test(body.url)) {
      return reply.status(400).send({ error: 'url (http/https) wird benötigt' });
    }
    try {
      return await importFeed(body.url, body);
    } catch (err) {
      return reply.status(502).send({ error: `Import fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}` });
    }
  });
}
