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
    { id: 'parliament-1', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Parlament Plenarsaal' },
    { id: 'parliament-2', url: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Rednerpult Pressekonferenz' },
    { id: 'parliament-3', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Regierungsgebäude' }
  ],
  'aussenpolitik': [
    { id: 'summit-1', url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Internationale Staatengemeinschaft' },
    { id: 'summit-2', url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Diplomatisches Gipfeltreffen' }
  ],
  'eu-politik': [
    { id: 'eu-1', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Europäische Institutionen' },
    { id: 'eu-2', url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Europapolitik Brüssel' }
  ],
  'wahlen': [
    { id: 'vote-1', url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Wahlurne und Stimmabgabe' }
  ],
  'justiz-recht': [
    { id: 'law-1', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Justizpalast & Gerichtsbarkeit' }
  ],
  'Politik': [
    { id: 'pol-default-1', url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Politische Berichterstattung' },
    { id: 'pol-default-2', url: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Pressekonferenz Bundespolitik' }
  ],

  // Wirtschaft
  'finanzen': [
    { id: 'fin-1', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Bankenviertel & Finanzzentrum' },
    { id: 'fin-2', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Finanzmärkte & Währung' }
  ],
  'boerse-maerkte': [
    { id: 'market-1', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Börsenkurse und Handelsplätze' }
  ],
  'unternehmen': [
    { id: 'corp-1', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Unternehmenszentrale & Management' }
  ],
  'inflation-preise': [
    { id: 'inf-1', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Preisstabilität und Inflation' }
  ],
  'arbeitsmarkt': [
    { id: 'work-1', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Moderne Arbeitswelt & Fachkräfte' }
  ],
  'energie-rohstoffe': [
    { id: 'energy-1', url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Erneuerbare Energien & Windkraft' }
  ],
  'Wirtschaft': [
    { id: 'ec-default-1', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Wirtschaftsmetropole' },
    { id: 'ec-default-2', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Industrie & Handel' }
  ],

  // Sport
  'fussball': [
    { id: 'football-1', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Fußballstadion Flutlicht' },
    { id: 'football-2', url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Stadionarena Rasenplatz' },
    { id: 'football-3', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Fußball Meisterschaft' }
  ],
  'wintersport': [
    { id: 'ski-1', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Alpiner Skisport & Schneelandschaft' },
    { id: 'ski-2', url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Winter-Bergpanorama' }
  ],
  'formel-1': [
    { id: 'f1-1', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Motorsport Rennstrecke' },
    { id: 'f1-2', url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Grand Prix Rennkurs' }
  ],
  'tennis': [
    { id: 'tennis-1', url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Tennis Center Court' }
  ],
  'schwimmen': [
    { id: 'swim-1', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Schwimmwettkampf Schmetterlingsstil' },
    { id: 'swim-2', url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Freistilschwimmerin im Becken' }
  ],
  'Sport': [
    { id: 'sp-default-1', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Leichtathletik Startblock' },
    { id: 'sp-default-2', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Stadion Atmosphäre' }
  ],

  // Technologie
  'ki-algorithmen': [
    { id: 'ai-1', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Künstliche Intelligenz & Datenmatrix' },
    { id: 'ai-2', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Neuronale Netzwerke & Cloud-Verbund' }
  ],
  'software-cloud': [
    { id: 'sw-1', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Softwareentwicklung & Quellcode' },
    { id: 'sw-2', url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Cloud-Infrastruktur & Monitore' }
  ],
  'cybersecurity': [
    { id: 'sec-1', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Cyber-Security & Datensicherheit' }
  ],
  'hardware-chips': [
    { id: 'hw-1', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Halbleiter & Mikroprozessor' }
  ],
  'Technologie': [
    { id: 'tech-default-1', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'High-Tech Hardware' },
    { id: 'tech-default-2', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Digitale Technologien' }
  ],

  // Kultur
  'film-kino': [
    { id: 'film-1', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Kinosessel & Premierenbühne' }
  ],
  'musik': [
    { id: 'music-1', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Klassisches Konzert & Orchester' },
    { id: 'music-2', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Konzerthalle Scheinwerfer' },
    { id: 'music-3', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Live-Bühnenperformance' }
  ],
  'theater-buehne': [
    { id: 'theater-1', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Opernhaus und Festspielbühne' }
  ],
  'literatur-kunst': [
    { id: 'art-1', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Kunstgalerie und Ausstellung' },
    { id: 'art-2', url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Museum & Historisches Erbe' }
  ],
  'Kultur': [
    { id: 'cult-default-1', url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Kulturinstitution & Bühne' },
    { id: 'cult-default-2', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1080&h=1920&q=90', caption: 'Kulturelles Ereignis' }
  ]
};

// German-aware whole-word matcher — plain .includes() false-positives on substrings
// buried inside unrelated words (e.g. "eu" inside "Europameisterschaft", "tor" inside "Autor").
const WORD_CHARS = 'a-zA-Z0-9äöüÄÖÜß';
function hasWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![${WORD_CHARS}])${escaped}(?![${WORD_CHARS}])`, 'i');
  return re.test(text);
}
function hasAny(text: string, words: string[]): boolean {
  return words.some(w => hasWord(text, w));
}

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Image generation encountered unexpected error: ${message}`);
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

    // Check keywords if no tag matched — whole-word matching to avoid false
    // positives like "eu" inside "Europameisterschaft" or "tor" inside "Autor".
    if (candidatePool.length === 0) {
      if (hasAny(fullText, ['parlament', 'regierung', 'nationalrat', 'koalition'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['innenpolitik'] || [];
      } else if (hasAny(fullText, ['diplomatie', 'eu', 'brüssel', 'gipfel'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['eu-politik'] || EDITORIAL_PHOTO_LIBRARY['aussenpolitik'] || [];
      } else if (hasAny(fullText, ['wahl', 'wahlen', 'stimme'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['wahlen'] || [];
      } else if (hasAny(fullText, ['bank', 'finanz', 'finanzen', 'ezb', 'zinsen'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['finanzen'] || [];
      } else if (hasAny(fullText, ['börse', 'aktie', 'aktien', 'dax', 'atx'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['boerse-maerkte'] || [];
      } else if (hasAny(fullText, ['energie', 'klima', 'wind', 'solar'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['energie-rohstoffe'] || [];
      } else if (hasAny(fullText, ['fußball', 'fussball', 'bundesliga', 'tor', 'elfmeter'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['fussball'] || [];
      } else if (hasAny(fullText, ['schwimmen', 'schwimmerin', 'schwimmer', 'freistil', 'becken', 'schwimmbad'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['schwimmen'] || [];
      } else if (hasAny(fullText, ['handball', 'basketball', 'volleyball'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['Sport'] || [];
      } else if (hasAny(fullText, ['ski', 'schnee', 'alpen', 'kitzbühel'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['wintersport'] || [];
      } else if (hasAny(fullText, ['formel', 'f1', 'rennen'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['formel-1'] || [];
      } else if (hasAny(fullText, ['ki', 'algorithmus', 'algorithmen', 'llm', 'quantencomputer'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['ki-algorithmen'] || [];
      } else if (hasAny(fullText, ['software', 'cloud', 'app', 'code'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['software-cloud'] || [];
      } else if (hasAny(fullText, ['cyber', 'sicherheit', 'hacker'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['cybersecurity'] || [];
      } else if (hasAny(fullText, ['chip', 'hardware', 'halbleiter'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['hardware-chips'] || [];
      } else if (hasAny(fullText, ['oper', 'theater', 'festspiel', 'bühne'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['theater-buehne'] || [];
      } else if (hasAny(fullText, ['konzert', 'musik', 'orchester'])) {
        candidatePool = EDITORIAL_PHOTO_LIBRARY['musik'] || [];
      } else if (hasAny(fullText, ['museum', 'kunst', 'ausstellung'])) {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Editorial photo download failed (${message}). Proceeding to fallback...`);
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
        size: "768x1344",
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
  } catch (localAiErr) {
    const message = localAiErr instanceof Error ? localAiErr.message : String(localAiErr);
    logger.info(`LocalAI not reachable: ${message}`);
  }

  // 2. Pollinations AI generation with photographic styling — the free public
  // endpoint rate-limits (429) or stalls under back-to-back requests, so retry
  // with backoff before giving up to the SVG placeholder.
  const cleanSubject = encodeURIComponent(`${articleCategory} news, ${articleTitle.slice(0, 50)}, editorial photography, vertical portrait composition, clean lighting, 4k`);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanSubject}?width=1080&height=1920&nologo=true&seed=${articleId * 37 + 11}`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const pollController = new AbortController();
      const pollTimeout = setTimeout(() => pollController.abort(), 25000);
      const pollRes = await fetch(pollinationsUrl, { signal: pollController.signal });
      clearTimeout(pollTimeout);

      if (pollRes.ok) {
        const buffer = Buffer.from(await pollRes.arrayBuffer());
        const filename = `article_${articleId}_${Date.now()}.jpg`;
        const filepath = path.join(IMAGES_DIR, filename);
        await fs.promises.writeFile(filepath, buffer);
        logger.info(`Pollinations AI image generated and saved: ${filename} (attempt ${attempt})`);
        return `/images/${filename}`;
      }

      logger.warn(`Pollinations AI returned non-OK status: ${pollRes.status} ${pollRes.statusText} (attempt ${attempt}/${maxAttempts})`);
      if (pollRes.status === 429 && attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, attempt * 6000));
      }
    } catch (pollErr) {
      const message = pollErr instanceof Error ? pollErr.message : String(pollErr);
      logger.warn(`Pollinations AI error: ${message} (attempt ${attempt}/${maxAttempts})`);
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, attempt * 4000));
      }
    }
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

    const titleLines: string[] = [];
    const words = escapedTitle.split(' ');
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (test.length > 20 && currentLine) {
        titleLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) titleLines.push(currentLine);
    const titleTspans = titleLines.slice(0, 5)
      .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 58}">${line}</tspan>`)
      .join('');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <radialGradient id="highlight" cx="25%" cy="15%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6" />
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bgGrad)" />
  <rect width="1080" height="1920" fill="url(#highlight)" />
  <circle cx="900" cy="260" r="340" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="80" />
  <rect x="80" y="120" width="200" height="46" rx="23" fill="rgba(255,255,255,0.2)" />
  <text x="180" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">${escapedCategory.toUpperCase()}</text>
  <text x="80" y="1500" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#ffffff">${titleTspans}</text>
  <text x="80" y="1820" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.75)">
    ORF.at Redaktion • KI Newsfeed
  </text>
</svg>`;
    await fs.promises.writeFile(svgFilepath, svgContent, 'utf-8');
    logger.info(`Offline editorial SVG image saved: ${svgFilename}`);
    return `/images/${svgFilename}`;
  } catch (svgErr) {
    const message = svgErr instanceof Error ? svgErr.message : String(svgErr);
    logger.error(`SVG generator error: ${message}`);
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

  if (hasAny(contextWords, ['parlament', 'nationalrat', 'regierung', 'minister', 'politik'])) {
    sceneSubject = 'grand democratic parliament chamber, wooden speaker podium with microphones, soft daylight, formal government hall';
  } else if (hasAny(contextWords, ['wahl', 'stimme', 'umfrage'])) {
    sceneSubject = 'election voting room with ballot boxes, paper ballots, atmospheric journalistic documentary setting';
  } else if (hasAny(contextWords, ['inflation', 'wirtschaft', 'bank', 'ezb', 'zinsen', 'export', 'handel'])) {
    sceneSubject = 'modern financial district glass skyscrapers, busy banking headquarters, stock exchange trading floor';
  } else if (hasAny(contextWords, ['ki', 'algorithmus', 'algorithmen', 'quantencomputer', 'software', 'technologie'])) {
    sceneSubject = 'advanced technology research laboratory, glowing fiber optic server racks, sleek computer workstations';
  } else if (hasAny(contextWords, ['schwimmen', 'schwimmerin', 'schwimmer', 'freistil', 'becken'])) {
    sceneSubject = 'competitive swimmer racing in an Olympic pool lane, dynamic splash of water, underwater lane markers, athletic motion';
  } else if (hasAny(contextWords, ['handball', 'basketball', 'volleyball'])) {
    sceneSubject = 'packed indoor sports arena, polished hardwood court, dramatic overhead floodlights, cheering crowd stands';
  } else if (hasAny(contextWords, ['fussball', 'fußball', 'sport'])) {
    sceneSubject = 'grand illuminated football stadium pitch, evening floodlights, pristine green grass';
  } else if (hasAny(contextWords, ['ski', 'schnee', 'alpen'])) {
    sceneSubject = 'alpine mountain peaks covered in fresh white powder snow, high alpine ski slope in bright morning sunlight';
  } else if (hasAny(contextWords, ['musik', 'konzert', 'orchester', 'festival'])) {
    sceneSubject = 'atmospheric concert hall stage, dramatic stage lighting, live performance energy';
  } else if (hasAny(contextWords, ['gesundheit', 'pflege', 'medizin', 'krankenhaus', 'klinik'])) {
    sceneSubject = 'modern hospital or care facility, clean clinical environment, compassionate healthcare setting';
  } else {
    sceneSubject = `${category} news event, authentic contemporary editorial news scene, high architectural quality`;
  }

  return `Award-winning editorial news photography of ${sceneSubject}. Vertical portrait orientation, 9:16 aspect ratio, full-bleed mobile smartphone framing, subject composed for a tall vertical frame. Documentary photojournalism style, shot on Leica 35mm lens, natural lighting, highly detailed, photorealistic, 8k resolution.`;
}
