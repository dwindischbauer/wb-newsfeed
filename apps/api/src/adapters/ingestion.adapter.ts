import { z } from 'zod';

export const RawArticlePayloadSchema = z.object({
  externalId: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  content: z.string().min(10, 'Content must be at least 10 characters long'),
  author: z.string().optional().default('Redaktion'),
  source: z.string().optional().default('cms-ingestion'),
  url: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
});

export type RawArticlePayload = z.infer<typeof RawArticlePayloadSchema>;

export interface IngestionAdapter {
  name: string;
  normalize(raw: unknown): RawArticlePayload;
}

export class StandardCMSAdapter implements IngestionAdapter {
  name = 'StandardCMSAdapter';

  normalize(raw: unknown): RawArticlePayload {
    return RawArticlePayloadSchema.parse(raw);
  }
}
