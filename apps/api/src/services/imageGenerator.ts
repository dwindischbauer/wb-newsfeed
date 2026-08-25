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
    logger.info(`Generating image for article ${articleId} via LocalAI...`);
    const prompt = buildImagePrompt(articleTitle, articleCategory);
    
    // Call LocalAI
    const response = await fetch('http://localhost:8080/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        size: "512x512"
      })
    });
    
    if (!response.ok) {
      logger.warn(`LocalAI image generation failed with status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data.data || data.data.length === 0 || !data.data[0].b64_json) {
      logger.warn('LocalAI returned invalid response format');
      return null;
    }
    
    const base64Data = data.data[0].b64_json;
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
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
