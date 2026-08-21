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
    // MOCK IMPLEMENTATION:
    // AI Image generation requires a dedicated GPU or an external paid API (like OpenAI/Midjourney).
    // Ollama's /api/generate does not generate images (it is a text/vision endpoint).
    // For this diplomarbeit, we mock the image generation using Unsplash placeholders.
    logger.info(`[MOCK] Generating image for article ${articleId}`, { prompt: buildImagePrompt(articleTitle, articleCategory) });
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use Unsplash source based on category
    const unsplashCategory = {
      'Politik': 'politics',
      'Wirtschaft': 'business',
      'Sport': 'sports',
      'Technologie': 'technology',
      'Kultur': 'culture'
    }[articleCategory] || 'news';
    
    // Download image from unsplash
    const response = await fetch(`https://source.unsplash.com/800x600/?${unsplashCategory}`);
    if (!response.ok) {
      logger.warn(`Image download failed with status ${response.status}, using fallback`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    const filename = `article_${articleId}_${Date.now()}.jpg`;
    const filepath = path.join(IMAGES_DIR, filename);

    fs.writeFileSync(filepath, imageBuffer);
    logger.info(`Image saved: ${filename}`);

    return `/images/${filename}`;
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
