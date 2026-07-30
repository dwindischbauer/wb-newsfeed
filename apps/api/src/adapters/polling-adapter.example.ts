import { IngestionAdapter, RawArticlePayload } from './ingestion.adapter.js';
import { logger } from '../services/logger.service.js';

export class CMSPollingAdapter implements IngestionAdapter {
  name = 'CMSPollingAdapter';
  private targetUrl: string;
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(targetUrl: string, intervalMs = 60000) {
    this.targetUrl = targetUrl;
    this.intervalMs = intervalMs;
  }

  normalize(raw: any): RawArticlePayload {
    return {
      externalId: String(raw.id || raw.guid || ''),
      title: String(raw.title?.rendered || raw.title || ''),
      content: String(raw.content?.rendered || raw.body || raw.content || ''),
      author: String(raw.author_name || raw.author || 'CMS Bot'),
      source: 'cms-polling-adapter',
      url: raw.link || raw.url,
      publishedAt: raw.date || raw.publishedAt,
    };
  }

  async pollAndIngest(onArticleFound: (payload: RawArticlePayload) => Promise<void>) {
    logger.info({ url: this.targetUrl }, 'Polling external CMS endpoint for new articles');
    try {
      const mockCmsResponse = [
        {
          id: 'cms-1092',
          title: 'Kommunale Digitalisierung vorangetrieben',
          content: 'Die Landesregierung stellt neue Budgetmittel bereit, um Schulen und Ämter weiter zu digitalisieren.',
          author: 'Redaktion Inland',
          date: new Date().toISOString(),
        },
      ];

      for (const rawArticle of mockCmsResponse) {
        const normalized = this.normalize(rawArticle);
        await onArticleFound(normalized);
      }
    } catch (err) {
      logger.error(err, 'Failed to poll CMS endpoint');
    }
  }

  start(onArticleFound: (payload: RawArticlePayload) => Promise<void>) {
    this.timer = setInterval(() => this.pollAndIngest(onArticleFound), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}
