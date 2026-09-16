import { db } from '../db';
import { settings } from '../db/schema';
import { getSettings } from '../utils/settings';
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
  articleId: number,
  teaser?: string,
  tags: string[] = []
): Promise<string | null> {
  try {
    logger.info(`Generating improved image for article ${articleId} via LocalAI...`);
    const prompt = buildEnhancedImagePrompt(articleTitle, articleCategory, teaser, tags);
    const negativePrompt = 'text, words, writing, watermark, logo, blurry, distorted, cartoon, anime, illustration, 3d render, bad anatomy, extra limbs, low quality, oversaturated';
    
    logger.info(`Synthesized visual prompt: "${prompt}"`);

    const settingsMap = await getSettings();
    
    const localAiUrl = settingsMap['localAiUrl'] || process.env.LOCALAI_URL || 'http://localhost:8080';
    const imageModel = settingsMap['imageModel'] || 'stable-diffusion-3-medium';
    const timeoutMs = parseInt(settingsMap['imageTimeout'] || '180000', 10);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Call LocalAI with prompt + negative_prompt
    const response = await fetch(`${localAiUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: prompt,
        negative_prompt: negativePrompt,
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

    await fs.promises.writeFile(filepath, imageBuffer);
    logger.info(`Enhanced image saved successfully: ${filename}`);

    return `/images/${filename}`;
  } catch (error: any) {
    logger.warn(`Image generation error: ${error.message}`);
    return null;
  }
}

function buildEnhancedImagePrompt(
  title: string,
  category: string,
  teaser?: string,
  tags: string[] = []
): string {
  // Translate topical tags and titles into visual English concepts
  const contextWords = `${title} ${teaser || ''} ${tags.join(' ')}`.toLowerCase();
  
  let sceneSubject = '';

  if (contextWords.includes('parlament') || contextWords.includes('nationalrat') || contextWords.includes('regierung') || contextWords.includes('minister') || contextWords.includes('politik')) {
    sceneSubject = 'grand democratic parliament chamber, wooden speaker podium with microphones, soft daylight entering through large historical windows, formal government hall';
  } else if (contextWords.includes('wahl') || contextWords.includes('stimme') || contextWords.includes('umfrage')) {
    sceneSubject = 'election voting room with ballot boxes, paper ballots, atmospheric journalistic documentary setting';
  } else if (contextWords.includes('eu') || contextWords.includes('brüssel') || contextWords.includes('gipfel') || contextWords.includes('diplomatie') || contextWords.includes('aussenpolitik')) {
    sceneSubject = 'international diplomatic summit conference hall, international flags in background, sleek modern negotiation table, press conference setting';
  } else if (contextWords.includes('inflation') || contextWords.includes('wirtschaft') || contextWords.includes('bank') || contextWords.includes('ezb') || contextWords.includes('zinsen') || contextWords.includes('finanz')) {
    sceneSubject = 'modern financial district glass skyscrapers, busy banking headquarters, stock exchange trading floor screens in background, corporate architecture';
  } else if (contextWords.includes('energie') || contextWords.includes('klima') || contextWords.includes('umwelt') || contextWords.includes('strom') || contextWords.includes('solar')) {
    sceneSubject = 'renewable energy wind turbines and modern solar panel fields stretching over dramatic green hills, golden sunset lighting, clean energy landscape';
  } else if (contextWords.includes('ki') || contextWords.includes('künstliche intelligenz') || contextWords.includes('tech') || contextWords.includes('software') || contextWords.includes('digital') || contextWords.includes('robot')) {
    sceneSubject = 'advanced technology research laboratory, glowing fiber optic server racks, sleek futuristic computer workstations, ambient blue luminescence';
  } else if (contextWords.includes('sport') || contextWords.includes('fussball') || contextWords.includes('fußball') || contextWords.includes('tor') || contextWords.includes('spiel')) {
    sceneSubject = 'grand illuminated football stadium pitch, evening floodlights, pristine green grass, cinematic wide angle sports photography';
  } else if (contextWords.includes('ski') || contextWords.includes('schnee') || contextWords.includes('alpen') || contextWords.includes('winter')) {
    sceneSubject = 'alpine mountain peaks covered in fresh white powder snow, high alpine ski slope in bright morning sunlight, Austrian alps panorama';
  } else if (contextWords.includes('kultur') || contextWords.includes('museum') || contextWords.includes('theater') || contextWords.includes('oper') || contextWords.includes('festspiel')) {
    sceneSubject = 'historic opera house auditorium with velvet seats and gilded balconies, dramatic stage spotlight, elegant cultural architecture';
  } else if (contextWords.includes('polizei') || contextWords.includes('gericht') || contextWords.includes('justiz') || contextWords.includes('chronik')) {
    sceneSubject = 'modern courthouse steps with classical columns, stately judicial hall, atmospheric dramatic lighting';
  } else {
    // Category fallback
    const categoryDefaults: Record<string, string> = {
      'Politik': 'formal political press hall, government podium with microphones, dignified architecture',
      'Wirtschaft': 'bustling modern metropolis, commercial financial headquarters, glass architecture',
      'Sport': 'dynamic outdoor athletic arena under bright stadium spotlights',
      'Technologie': 'state of the art high-tech laboratory, computing servers, clean minimalist design',
      'Kultur': 'contemporary art exhibition gallery, warm museum lighting, architectural elegance'
    };
    sceneSubject = categoryDefaults[category] || 'authentic contemporary editorial news scene, architectural realism';
  }

  // Combine into a high-end photography prompt
  return `Award-winning editorial news photography of ${sceneSubject}. Documentary photojournalism style, shot on Leica 35mm lens at f/2.8, cinematic natural lighting, highly detailed textures, realistic depth of field, photorealistic, 8k resolution.`;
}
