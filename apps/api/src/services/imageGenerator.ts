import { db } from '../db';
import { settings } from '../db/schema';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

export async function generateArticleImage(
  articleTitle: string,
  articleCategory: string,
  articleId: number
): Promise<string | null> {
  try {
    const allSettings = await db.select().from(settings);
    const settingsMap = allSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const ollamaUrl = settingsMap['ollamaUrl'] || 'http://localhost:11434';
    const imageModel = settingsMap['imageModel'] || 'x/z-image-turbo';

    const prompt = buildImagePrompt(articleTitle, articleCategory);

    logger.info(`Generating image for article ${articleId}`, { prompt, model: imageModel });

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: imageModel,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      logger.warn(`Image generation failed with status ${response.status}, using fallback`);
      return null;
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      const imageBuffer = Buffer.from(data.images[0], 'base64');
      const filename = `article_${articleId}_${Date.now()}.png`;
      const filepath = path.join(IMAGES_DIR, filename);

      fs.writeFileSync(filepath, imageBuffer);
      logger.info(`Image saved: ${filename}`);

      return `/images/${filename}`;
    }

    return null;
  } catch (error: any) {
    logger.warn(`Image generation error: ${error.message}`);
    return null;
  }
}

function buildImagePrompt(title: string, category: string): string {
  const categoryStyles: Record<string, string> = {
    'Politik': 'political setting, parliament, government buildings, formal atmosphere',
    'Wirtschaft': 'business, finance, stock market charts, corporate skyline',
    'Sport': 'athletic competition, stadium, dynamic sports action',
    'Technologie': 'futuristic technology, digital interface, innovation, circuits',
    'Kultur': 'art gallery, cultural event, theater, creative expression'
  };

  const style = categoryStyles[category] || 'news editorial, modern journalism';

  return `Professional news article cover image. Topic: ${title}. Style: ${style}. Photorealistic, high quality, editorial photography, cinematic lighting.`;
}
