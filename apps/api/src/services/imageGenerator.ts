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
    const timeoutMs = parseInt(settingsMap['imageTimeout'] || '5000', 10); // Quick check for LocalAI

    try {
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
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          let imageBuffer: Buffer | null = null;
          if (data.data[0].b64_json) {
            imageBuffer = Buffer.from(data.data[0].b64_json, 'base64');
          } else if (data.data[0].url) {
            const imgRes = await fetch(data.data[0].url);
            if (imgRes.ok) {
              imageBuffer = Buffer.from(await imgRes.arrayBuffer());
            }
          }

          if (imageBuffer) {
            const filename = `article_${articleId}_${Date.now()}.png`;
            const filepath = path.join(IMAGES_DIR, filename);
            await fs.promises.writeFile(filepath, imageBuffer);
            logger.info(`LocalAI image saved successfully: ${filename}`);
            return `/images/${filename}`;
          }
        }
      }
    } catch (localAiErr: any) {
      logger.info(`LocalAI not reachable or failed (${localAiErr.message}). Switching to Pollinations AI...`);
    }

    // Fallback 1: Photorealistic Pollinations AI generation
    try {
      logger.info(`Generating photorealistic visual via Pollinations AI for article ${articleId}...`);
      const cleanSubject = encodeURIComponent(`${articleCategory} news: ${articleTitle.slice(0, 60)}, photojournalism, 8k, realistic lighting`);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanSubject}?width=1024&height=768&nologo=true&seed=${articleId * 31 + 42}`;
      
      const pollController = new AbortController();
      const pollTimeout = setTimeout(() => pollController.abort(), 20000);
      const pollRes = await fetch(pollinationsUrl, { signal: pollController.signal });
      clearTimeout(pollTimeout);

      if (pollRes.ok) {
        const arrayBuf = await pollRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const filename = `article_${articleId}_${Date.now()}.jpg`;
        const filepath = path.join(IMAGES_DIR, filename);
        await fs.promises.writeFile(filepath, buffer);
        logger.info(`Pollinations AI image generated and saved: ${filename}`);
        return `/images/${filename}`;
      }
    } catch (pollErr: any) {
      logger.warn(`Pollinations AI generation error: ${pollErr.message}`);
    }

    // Fallback 2: Offline Editorial SVG Visual Card
    try {
      const svgFilename = `article_${articleId}_${Date.now()}.svg`;
      const svgFilepath = path.join(IMAGES_DIR, svgFilename);
      const categoryGradients: Record<string, [string, string]> = {
        'Politik': ['#b91c1c', '#450a0a'],
        'Wirtschaft': ['#047857', '#022c22'],
        'Sport': ['#d97706', '#451a03'],
        'Technologie': ['#4338ca', '#1e1b4b'],
        'Kultur': ['#a21caf', '#4a044e']
      };
      const [c1, c2] = categoryGradients[articleCategory] || ['#1d4ed8', '#0f172a'];
      const escapedTitle = articleTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedCategory = articleCategory.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <radialGradient id="highlight" cx="20%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6" />
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bgGrad)" />
  <rect width="1200" height="675" fill="url(#highlight)" />
  <circle cx="1050" cy="180" r="300" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="80" />
  <rect x="80" y="80" width="180" height="42" rx="21" fill="rgba(255,255,255,0.2)" />
  <text x="170" y="107" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">${escapedCategory.toUpperCase()}</text>
  <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#ffffff">
    ${escapedTitle.length > 40 ? escapedTitle.slice(0, 38) + '...' : escapedTitle}
  </text>
  <text x="80" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="rgba(255,255,255,0.75)">
    ORF.at Redaktion • KI Newsfeed
  </text>
</svg>`;
      await fs.promises.writeFile(svgFilepath, svgContent, 'utf-8');
      logger.info(`Offline editorial SVG image saved: ${svgFilename}`);
      return `/images/${svgFilename}`;
    } catch (svgErr: any) {
      logger.error(`SVG generator error: ${svgErr.message}`);
      return null;
    }
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
