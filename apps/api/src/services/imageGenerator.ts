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
    
    const allSettings = await db.select().from(settings);
    const settingsMap = allSettings.reduce((acc, curr) => { acc[curr.key] = curr.value; return acc; }, {} as Record<string, string>);
    
    const localAiUrl = settingsMap['localAiUrl'] || process.env.LOCALAI_URL || 'http://localhost:8080';
    const imageModel = settingsMap['imageModel'] || 'stablediffusion';
    const timeoutMs = parseInt(settingsMap['imageTimeout'] || '180000', 10);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Call LocalAI
    const response = await fetch(`${localAiUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: prompt,
        size: "1024x1024",
        response_format: "b64_json"
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let bodyText = '';
      try { bodyText = await response.text(); } catch (e) {}
      logger.warn(`LocalAI image generation failed with status ${response.status}. Body: ${bodyText}`);
      return null;
    }
    
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      logger.warn(`LocalAI returned empty data array. Response: ${JSON.stringify(data)}`);
      return null;
    }
    
    let imageBuffer: Buffer;
    
    if (data.data[0].b64_json) {
      imageBuffer = Buffer.from(data.data[0].b64_json, 'base64');
    } else if (data.data[0].url) {
      const imgRes = await fetch(data.data[0].url);
      if (!imgRes.ok) {
         logger.warn(`Failed to fetch image from URL: ${data.data[0].url}`);
         return null;
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      logger.warn(`LocalAI returned neither b64_json nor url. Response: ${JSON.stringify(data)}`);
      return null;
    }
    
    const filename = `article_${articleId}_${Date.now()}.png`;
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

  // Do NOT include the specific article title in the prompt because SD 1.5 struggles to render text
  // and will produce blurry text artifacts in the image. Keep it purely visual.
  return `Professional high-quality news article cover image. Theme: ${category}. Style: ${style}. No text, no words. Photorealistic, editorial photography, cinematic lighting, 8k resolution, highly detailed.`;
}
