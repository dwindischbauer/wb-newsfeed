import type { FastifyInstance } from 'fastify';
import type { InferSelectModel } from 'drizzle-orm';
import { db } from '../db';
import { analyticsEvents, articles } from '../db/schema';
import { desc, sql } from 'drizzle-orm';

type AnalyticsEvent = InferSelectModel<typeof analyticsEvents>;
type ArticleRecord = InferSelectModel<typeof articles>;

export default async function (server: FastifyInstance) {
  // Ingest tracking events (Public endpoint called by mobile feed / readers)
  server.post('/api/analytics/events', async (request, reply) => {
    try {
      const body = request.body as {
        eventType?: string;
        articleId?: number;
        metadata?: unknown;
      };

      if (!body || !body.eventType) {
        return reply.status(400).send({ error: 'eventType is required' });
      }

      // dwell = Sekunden auf einer Karte, read_time = Sekunden in der Artikelansicht
      const validEvents = ['impression', 'read', 'scroll_depth', 'share', 'dwell', 'read_time'];
      if (!validEvents.includes(body.eventType)) {
        return reply.status(400).send({ error: `Invalid eventType: ${body.eventType}` });
      }

      const metaString = body.metadata ? (typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata)) : null;

      await db.insert(analyticsEvents).values({
        eventType: body.eventType,
        articleId: body.articleId || null,
        metadata: metaString
      });

      return { success: true };
    } catch (e) {
      server.log.warn({ err: e }, 'Failed to insert analytics event');
      // Return 200/accepted even if DB is temporarily busy so clients are never blocked
      return { success: false, error: 'Event noted' };
    }
  });

  // Kennzahlen je Artikel fuer das Admin: Aufrufe, Verweildauer, Oeffnungen, Lesedauer
  server.get('/api/analytics/articles', async () => {
    const rows = await db.execute(sql`
      SELECT a.id,
             count(*) FILTER (WHERE e.event_type = 'impression')::int AS impressions,
             count(*) FILTER (WHERE e.event_type = 'read')::int AS reads,
             count(*) FILTER (WHERE e.event_type = 'dwell')::int AS dwells,
             round(avg((e.metadata::json->>'seconds')::float) FILTER (WHERE e.event_type = 'dwell')::numeric, 1)::float AS avg_dwell_seconds,
             round(avg((e.metadata::json->>'seconds')::float) FILTER (WHERE e.event_type = 'read_time')::numeric, 1)::float AS avg_read_seconds,
             count(*) FILTER (WHERE e.event_type = 'dwell' AND (e.metadata::json->>'seconds')::float < 1.5)::int AS quick_skips,
             a.like_count AS likes, a.comment_count AS comments, a.share_count AS shares
        FROM articles a
        LEFT JOIN analytics_events e ON e.article_id = a.id
       GROUP BY a.id
       ORDER BY a.id DESC
    `);
    return rows.rows.map((r) => ({
      articleId: r.id,
      impressions: r.impressions,
      reads: r.reads,
      avgDwellSeconds: r.avg_dwell_seconds,
      avgReadSeconds: r.avg_read_seconds,
      quickSkips: r.quick_skips,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares
    }));
  });

  // Aggregated analytics metrics for Admin CMS Dashboard
  server.get('/api/analytics', async () => {
    try {
      let events: AnalyticsEvent[] = [];
      try {
        events = await db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)).limit(500);
      } catch {
        events = [];
      }

      const totalImpressions = events.filter((e) => e.eventType === 'impression').length;
      const totalReads = events.filter((e) => e.eventType === 'read').length;

      const readThroughRate = totalImpressions > 0
        ? `${((totalReads / totalImpressions) * 100).toFixed(1)}%`
        : '0.0%';

      // Popular articles calculation
      const articleReadCounts = new Map<number, { impressions: number; reads: number }>();
      for (const ev of events) {
        if (!ev.articleId) continue;
        const current = articleReadCounts.get(ev.articleId) || { impressions: 0, reads: 0 };
        if (ev.eventType === 'impression') current.impressions++;
        if (ev.eventType === 'read') current.reads++;
        articleReadCounts.set(ev.articleId, current);
      }

      // Fetch top article details
      let allArticles: ArticleRecord[] = [];
      try {
        allArticles = await db.select().from(articles);
      } catch {
        allArticles = [];
      }

      const popularArticles = Array.from(articleReadCounts.entries())
        .map(([id, counts]) => {
          const art = allArticles.find((a) => a.id === id);
          return {
            id,
            title: art ? art.title : `Artikel #${id}`,
            category: art ? art.category : 'Allgemein',
            impressions: counts.impressions,
            reads: counts.reads,
            readRate: counts.impressions > 0 ? `${((counts.reads / counts.impressions) * 100).toFixed(0)}%` : '0%'
          };
        })
        .sort((a, b) => (b.reads * 2 + b.impressions) - (a.reads * 2 + a.impressions))
        .slice(0, 5);

      return {
        totalImpressions,
        totalReads,
        readThroughRate,
        popularArticles,
        recentEventsCount: events.length,
        recentEvents: events.slice(0, 10).map((e) => ({
          id: e.id,
          eventType: e.eventType,
          articleId: e.articleId,
          createdAt: e.createdAt
        }))
      };
    } catch (e) {
      server.log.error(e);
      return {
        totalImpressions: 0,
        totalReads: 0,
        readThroughRate: '0.0%',
        popularArticles: [],
        recentEventsCount: 0,
        recentEvents: []
      };
    }
  });
}
