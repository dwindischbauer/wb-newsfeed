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

// Curated authentic editorial photojournalism library (high resolution, watermark-free, verified 200 OK)
interface EditorialImageEntry {
  id: string;
  url: string;
  caption: string;
}

const EDITORIAL_PHOTO_LIBRARY: Record<string, EditorialImageEntry[]> = {
  // Politik
  'innenpolitik': [
    { id: 'parliament-1', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=85', caption: 'Parlament Plenarsaal' },
    { id: 'parliament-2', url: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1200&q=85', caption: 'Rednerpult Pressekonferenz' },
    { id: 'parliament-3', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85', caption: 'Regierungsgebäude' }
  ],
  'aussenpolitik': [
    { id: 'summit-1', url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=85', caption: 'Internationale Staatengemeinschaft' },
    { id: 'summit-2', url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=85', caption: 'Diplomatisches Gipfeltreffen' }
  ],
  'eu-politik': [
    { id: 'eu-1', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85', caption: 'Europäische Institutionen' },
    { id: 'eu-2', url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=85', caption: 'Europapolitik Brüssel' }
  ],
  'wahlen': [
    { id: 'vote-1', url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=85', caption: 'Wahlurne und Stimmabgabe' }
  ],
  'justiz-recht': [
    { id: 'law-1', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=85', caption: 'Justizpalast & Gerichtsbarkeit' }
  ],
  'Politik': [
    { id: 'pol-default-1', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=85', caption: 'Politische Berichterstattung' },
    { id: 'pol-default-2', url: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1200&q=85', caption: 'Pressekonferenz Bundespolitik' }
  ],

  // Wirtschaft
  'finanzen': [
    { id: 'fin-1', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85', caption: 'Bankenviertel & Finanzzentrum' },
    { id: 'fin-2', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=85', caption: 'Finanzmärkte & Währung' }
  ],
  'boerse-maerkte': [
    { id: 'market-1', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=85', caption: 'Börsenkurse und Handelsplätze' }
  ],
  'unternehmen': [
    { id: 'corp-1', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85', caption: 'Unternehmenszentrale & Management' }
  ],
  'inflation-preise': [
    { id: 'inf-1', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=85', caption: 'Preisstabilität und Inflation' }
  ],
  'arbeitsmarkt': [
    { id: 'work-1', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85', caption: 'Moderne Arbeitswelt & Fachkräfte' }
  ],
  'energie-rohstoffe': [
    { id: 'energy-1', url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=85', caption: 'Erneuerbare Energien & Windkraft' }
  ],
  'Wirtschaft': [
    { id: 'ec-default-1', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85', caption: 'Wirtschaftsmetropole' },
    { id: 'ec-default-2', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85', caption: 'Industrie & Handel' }
  ],

  // Sport
  'fussball': [
    { id: 'football-1', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85', caption: 'Fußballstadion Flutlicht' },
    { id: 'football-2', url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=85', caption: 'Stadionarena Rasenplatz' },
    { id: 'football-3', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85', caption: 'Fußball Meisterschaft' }
  ],
  'wintersport': [
    { id: 'ski-1', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=85', caption: 'Alpiner Skisport & Schneelandschaft' },
    { id: 'ski-2', url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1200&q=85', caption: 'Winter-Bergpanorama' }
  ],
  'formel-1': [
    { id: 'f1-1', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=85', caption: 'Motorsport Rennstrecke' },
    { id: 'f1-2', url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=85', caption: 'Grand Prix Rennkurs' }
  ],
  'tennis': [
    { id: 'tennis-1', url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=85', caption: 'Tennis Center Court' }
  ],
  'Sport': [
    { id: 'sp-default-1', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85', caption: 'Sportarena & Wettkampf' },
    { id: 'sp-default-2', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=85', caption: 'Stadion Atmosphäre' }
  ],

  // Technologie
  'ki-algorithmen': [
    { id: 'ai-1', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=85', caption: 'Künstliche Intelligenz & Datenmatrix' },
    { id: 'ai-2', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85', caption: 'Neuronale Netzwerke & Cloud-Verbund' }
  ],
  'software-cloud': [
    { id: 'sw-1', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85', caption: 'Softwareentwicklung & Quellcode' },
    { id: 'sw-2', url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=85', caption: 'Cloud-Infrastruktur & Monitore' }
  ],
  'cybersecurity': [
    { id: 'sec-1', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=85', caption: 'Cyber-Security & Datensicherheit' }
  ],
  'hardware-chips': [
    { id: 'hw-1', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85', caption: 'Halbleiter & Mikroprozessor' }
  ],
  'Technologie': [
    { id: 'tech-default-1', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85', caption: 'High-Tech Hardware' },
    { id: 'tech-default-2', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85', caption: 'Digitale Technologien' }
  ],

  // Kultur
  'film-kino': [
    { id: 'film-1', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85', caption: 'Kinosessel & Premierenbühne' }
  ],
  'musik': [
    { id: 'music-1', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=85', caption: 'Klassisches Konzert & Orchester' },
    { id: 'music-2', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=85', caption: 'Konzerthalle Scheinwerfer' },
    { id: 'music-3', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85', caption: 'Live-Bühnenperformance' }
  ],
  'theater-buehne': [
    { id: 'theater-1', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=85', caption: 'Opernhaus und Festspielbühne' }
  ],
  'literatur-kunst': [
    { id: 'art-1', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85', caption: 'Kunstgalerie und Ausstellung' },
    { id: 'art-2', url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=85', caption: 'Museum & Historisches Erbe' }
  ],
  'Kultur': [
    { id: 'cult-default-1', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=85', caption: 'Kulturinstitution & Bühne' },
    { id: 'cult-default-2', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=85', caption: 'Kulturelles Ereignis' }
  ]
};

export async function generateArticleImage(
  articleTitle: string,
  articleCategory: string,
  articleId: number,
  teaser?: string,
  tags: string[] = [],
  mode: 'editorial' | 'ai' = 'editorial'
): Promise<string | null> {
  try {
    logger.info(`Processing image generation for article #${articleId} (Mode: ${mode}, Category: ${articleCategory})...`);

    // MODE 1: Curated Editorial Photojournalism (Crisp, authentic, watermark-free, instant)
    if (mode === 'editorial') {
      const editorialResult = await resolveAndDownloadEditorialPhoto(articleTitle, articleCategory, articleId, teaser, tags);
      if (editorialResult) {
        return editorialResult;
      }
      logger.info(`Editorial photo download skipped or unavailable, trying fallback generation...`);
    }

    // MODE 2: LocalAI or Pollinations AI image generation
    const aiResult = await tryAiImageGeneration(articleTitle, articleCategory, articleId, teaser, tags);
    if (aiResult) {
      return aiResult;
    }

    // Fallback: Editorial SVG Visual Card
    return await generateSvgCard(articleTitle, articleCategory, articleId);
  } catch (error: any) {
    logger.warn(`Image generation encountered unexpected error: ${error.message}`);
    return await generateSvgCard(articleTitle, articleCategory, articleId);
  }
}

async function resolveAndDownloadEditorialPhoto(
  title: string,
  category: string,
  articleId: number,
  teaser?: string,
  tags: string[] = []
): Promise<string | null> {
  try {
    // 1. Identify best subtag or category pool
    let candidatePool: EditorialImageEntry[] = [];
    const normalizedTags = tags.map(t => t.toLowerCase().trim());
    const fullText = `${title} ${teaser || ''} ${tags.join(' ')}`.toLowerCase();

    // Check tags against library keys
    for (const tag of normalizedTags) {
      if (EDITORIAL_PHOTO_LIBRARY[tag]) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY[tag];
        break;
      }
    }

    // Check keywords if no tag matched
    if (candidatePool.length === 0) {
      if (fullText.includes('parlament') || fullText.includes('regierung') || fullText.includes('nationalrat') || fullText.includes('koalition')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['innenpolitik'] || [];
      } else if (fullText.includes('diplomatie') || fullText.includes('eu') || fullText.includes('brüssel') || fullText.includes('gipfel')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['eu-politik'] || EDITORIAL_PHOTO_LIBRARY['aussenpolitik'] || [];
      } else if (fullText.includes('wahl') || fullText.includes('stimme')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['wahlen'] || [];
      } else if (fullText.includes('bank') || fullText.includes('finanz') || fullText.includes('ezb') || fullText.includes('zinsen')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['finanzen'] || [];
      } else if (fullText.includes('börse') || fullText.includes('aktie') || fullText.includes('dax') || fullText.includes('atx')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['boerse-maerkte'] || [];
      } else if (fullText.includes('energie') || fullText.includes('klima') || fullText.includes('wind') || fullText.includes('solar')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['energie-rohstoffe'] || [];
      } else if (fullText.includes('fußball') || fullText.includes('fussball') || fullText.includes('bundesliga') || fullText.includes('tor')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['fussball'] || [];
      } else if (fullText.includes('ski') || fullText.includes('schnee') || fullText.includes('alpen') || fullText.includes('kitzbühel')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['wintersport'] || [];
      } else if (fullText.includes('formel 1') || fullText.includes('f1') || fullText.includes('rennen')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['formel-1'] || [];
      } else if (fullText.includes('ki') || fullText.includes('künstliche intelligenz') || fullText.includes('algor') || fullText.includes('llm')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['ki-algorithmen'] || [];
      } else if (fullText.includes('software') || fullText.includes('cloud') || fullText.includes('app') || fullText.includes('code')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['software-cloud'] || [];
      } else if (fullText.includes('cyber') || fullText.includes('sicherheit') || fullText.includes('hacker')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['cybersecurity'] || [];
      } else if (fullText.includes('chip') || fullText.includes('hardware') || fullText.includes('halbleiter')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['hardware-chips'] || [];
      } else if (fullText.includes('oper') || fullText.includes('theater') || fullText.includes('festspiel') || fullText.includes('bühne')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['theater-buehne'] || [];
      } else if (fullText.includes('konzert') || fullText.includes('musik') || fullText.includes('orchester')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['musik'] || [];
      } else if (fullText.includes('museum') || fullText.includes('kunst') || fullText.includes('ausstellung')) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['literatur-kunst'] || [];
      }
    }

    // Fall back to category pool
    if (candidatePool.length === 0) {
      candidatePool = EDITORIAL_PHOTO_LIBRARY[category] || EDITORIAL_PHOTO_LIBRARY['Technologie'] || [];
    }

    if (candidatePool.length === 0) {
      return null;
    }

    // Deterministic selection based on articleId to ensure consistency
    const chosenIndex = Math.abs((articleId * 7 + title.length)) % candidatePool.length;
    const selectedPhoto = candidatePool[chosenIndex];

    logger.info(`Selected editorial photo "${selectedPhoto.caption}" for article #${articleId}`);

    // Download and cache locally as a permanent JPEG file
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(selectedPhoto.url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `article_${articleId}_${Date.now()}.jpg`;
      const filepath = path.join(IMAGES_DIR, filename);
      await fs.promises.writeFile(filepath, buffer);
      logger.info(`Downloaded and saved authentic editorial photo: ${filename} (${buffer.length} bytes)`);
      return `/images/${filename}`;
    }
    return null;
  } catch (err: any) {
    logger.warn(`Editorial photo download failed (${err.message}). Proceeding to fallback...`);
    return null;
  }
}

async function tryAiImageGeneration(
  articleTitle: string,
  articleCategory: string,
  articleId: number,
  teaser?: string,
  tags: string[] = []
): Promise<string | null> {
  const prompt = buildEnhancedImagePrompt(articleTitle, articleCategory, teaser, tags);
  const negativePrompt = 'text, words, writing, watermark, logo, blurry, distorted, cartoon, anime, illustration, 3d render, bad anatomy, low quality';
  
  const settingsMap = await getSettings();
  const localAiUrl = settingsMap['localAiUrl'] || process.env.LOCALAI_URL || 'http://localhost:8080';
  const imageModel = settingsMap['imageModel'] || 'stable-diffusion-3-medium';
  const timeoutMs = parseInt(settingsMap['imageTimeout'] || '5000', 10);

  // 1. Try LocalAI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(`${localAiUrl}/v1/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
          logger.info(`LocalAI image saved: ${filename}`);
          return `/images/${filename}`;
        }
      }
    }
  } catch (localAiErr: any) {
    logger.info(`LocalAI not reachable: ${localAiErr.message}`);
  }

  // 2. Pollinations AI generation with photographic styling
  try {
    const cleanSubject = encodeURIComponent(`${articleCategory} news, ${articleTitle.slice(0, 50)}, editorial photography, clean lighting, 4k`);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanSubject}?width=1024&height=768&nologo=true&seed=${articleId * 37 + 11}`;
    
    const pollController = new AbortController();
    const pollTimeout = setTimeout(() => pollController.abort(), 20000);
    const pollRes = await fetch(pollinationsUrl, { signal: pollController.signal });
    clearTimeout(pollTimeout);

    if (pollRes.ok) {
      const buffer = Buffer.from(await pollRes.arrayBuffer());
      const filename = `article_${articleId}_${Date.now()}.jpg`;
      const filepath = path.join(IMAGES_DIR, filename);
      await fs.promises.writeFile(filepath, buffer);
      logger.info(`Pollinations AI image generated and saved: ${filename}`);
      return `/images/${filename}`;
    }
  } catch (pollErr: any) {
    logger.warn(`Pollinations AI error: ${pollErr.message}`);
  }

  return null;
}

async function generateSvgCard(title: string, category: string, articleId: number): Promise<string | null> {
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
    const [c1, c2] = categoryGradients[category] || ['#1d4ed8', '#0f172a'];
    const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedCategory = category.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
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
  <rect width="1080" height="1920" fill="url(#bgGrad)" />
  <rect width="1080" height="1920" fill="url(#highlight)" />
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
}

function buildEnhancedImagePrompt(
  title: string,
  category: string,
  teaser?: string,
  tags: string[] = []
): string {
  const contextWords = `${title} ${teaser || ''} ${tags.join(' ')}`.toLowerCase();
  
  let sceneSubject = '';

  if (contextWords.includes('parlament') || contextWords.includes('nationalrat') || contextWords.includes('regierung') || contextWords.includes('minister') || contextWords.includes('politik')) {
    sceneSubject = 'grand democratic parliament chamber, wooden speaker podium with microphones, soft daylight, formal government hall';
  } else if (contextWords.includes('wahl') || contextWords.includes('stimme') || contextWords.includes('umfrage')) {
    sceneSubject = 'election voting room with ballot boxes, paper ballots, atmospheric journalistic documentary setting';
  } else if (contextWords.includes('inflation') || contextWords.includes('wirtschaft') || contextWords.includes('bank') || contextWords.includes('ezb') || contextWords.includes('zinsen')) {
    sceneSubject = 'modern financial district glass skyscrapers, busy banking headquarters, stock exchange trading floor';
  } else if (contextWords.includes('ki') || contextWords.includes('künstliche intelligenz') || contextWords.includes('tech') || contextWords.includes('software')) {
    sceneSubject = 'advanced technology research laboratory, glowing fiber optic server racks, sleek computer workstations';
  } else if (contextWords.includes('sport') || contextWords.includes('fussball') || contextWords.includes('fußball')) {
    sceneSubject = 'grand illuminated football stadium pitch, evening floodlights, pristine green grass';
  } else if (contextWords.includes('ski') || contextWords.includes('schnee') || contextWords.includes('alpen')) {
    sceneSubject = 'alpine mountain peaks covered in fresh white powder snow, high alpine ski slope in bright morning sunlight';
  } else {
    sceneSubject = `${category} news event, authentic contemporary editorial news scene, high architectural quality`;
  }

  return `Award-winning editorial news photography of ${sceneSubject}. Documentary photojournalism style, shot on Leica 35mm lens, natural lighting, highly detailed, photorealistic, 8k resolution.`;
}