import * as fs from 'fs';
import * as path from 'path';
import { getSettings } from '../utils/settings';
import { logger } from '../utils/logger';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Hochformat fuer den Feed, durch 16 teilbar
const IMAGE_SIZE = '768x1344';

const PHOTO_STYLE =
  'Editorial news photograph, vertical 9:16 frame, natural light, realistic colors, 35mm lens, shallow depth of field, sharp focus';

export type ImageProvider = 'local' | 'gemini';

export interface ImageArticle {
  id: number;
  title: string;
  category: string;
  teaser?: string | null;
  content?: string | null;
  tags?: string[];
}

export interface ImageResult {
  imageUrl: string;
  prompt: string;
  provider: ImageProvider;
  seconds: number;
}

export class ImageServerError extends Error {}

/**
 * Erzeugt ein Titelbild und legt es unter public/images ab.
 * Anbieter laut Einstellung imageProvider:
 *  - local:  eigener Bildserver (services/image, FLUX.1-schnell oder Z-Image-Turbo)
 *  - gemini: Google Gemini API, z. B. Nano Banana Pro (gemini-3-pro-image-preview)
 */
export async function generateArticleImage(article: ImageArticle): Promise<ImageResult> {
  const settings = await getSettings();
  const provider: ImageProvider = settings['imageProvider'] === 'gemini' ? 'gemini' : 'local';
  const started = Date.now();

  const { buffer, extension, prompt } = provider === 'gemini'
    ? await generateWithGemini(article, settings)
    : await generateLocally(article, settings);

  const filename = `article_${article.id}_${Date.now()}.${extension}`;
  await fs.promises.writeFile(path.join(IMAGES_DIR, filename), buffer);

  const seconds = Math.round((Date.now() - started) / 100) / 10;
  logger.info(`Bild gespeichert: ${filename} (${provider}, ${seconds} s)`);
  return { imageUrl: `/images/${filename}`, prompt, provider, seconds };
}

async function generateLocally(article: ImageArticle, settings: Record<string, string>) {
  const serverUrl = (settings['imageServerUrl'] || process.env.IMAGE_SERVER_URL || 'http://localhost:8080').replace(/\/$/, '');
  const timeoutMs = parseInt(settings['imageTimeout'] || '300000', 10);

  const scene = await describeScene(article, settings);
  const prompt = `${scene}. ${PHOTO_STYLE}.`;
  // Gleicher Artikel ergibt ohne Aenderung am Prompt dasselbe Bild
  const seed = article.id * 7919 + 17;
  logger.info(`Bild fuer Artikel #${article.id} (lokal)`, { prompt });

  let response: Response;
  try {
    response = await fetch(`${serverUrl}/v1/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: settings['imageModel'] || undefined, size: IMAGE_SIZE, seed, response_format: 'b64_json' }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (err) {
    throw new ImageServerError(`Bildserver nicht erreichbar (${serverUrl}): ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) {
    throw new ImageServerError(`Bildserver antwortet mit ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new ImageServerError('Bildserver hat kein Bild geliefert');
  return { buffer: Buffer.from(b64, 'base64'), extension: 'jpg', prompt };
}

/**
 * Gemini versteht Deutsch und bekommt den Artikel direkt, ohne Umweg ueber Ollama.
 * API-Key kommt aus GEMINI_API_KEY (.env), nie aus der Datenbank.
 */
async function generateWithGemini(article: ImageArticle, settings: Record<string, string>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ImageServerError('GEMINI_API_KEY fehlt in der .env');
  const model = settings['geminiModel'] || 'gemini-3-pro-image-preview';

  const prompt = `Erstelle ein realistisches, redaktionelles Nachrichtenfoto im Hochformat zu diesem Artikel.
Zeige eine konkrete, glaubwürdige Szene, die zum Inhalt passt. Keine Schrift, keine Logos, keine Wasserzeichen,
keine erkennbaren realen Personen. Orte nur zeigen, wenn sie im Artikel vorkommen.

Titel: ${article.title}
Kategorie: ${article.category}
Inhalt: ${article.teaser || (article.content || '').slice(0, 1200)}`;

  const imageConfig: Record<string, string> = { aspectRatio: '9:16' };
  if (model.includes('pro')) imageConfig.imageSize = settings['geminiImageSize'] || '1K';

  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig }
      }),
      signal: AbortSignal.timeout(180000)
    });
  } catch (err) {
    throw new ImageServerError(`Gemini nicht erreichbar: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!response.ok) {
    throw new ImageServerError(`Gemini antwortet mit ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
  };
  const image = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!image?.data) throw new ImageServerError('Gemini hat kein Bild geliefert');
  const extension = image.mimeType === 'image/jpeg' ? 'jpg' : 'png';
  return { buffer: Buffer.from(image.data, 'base64'), extension, prompt };
}

interface OllamaOptions {
  url: string;
  model: string;
  think: boolean;
}

/**
 * Fragt Ollama mit JSON-Antwort. Mit think denkt ein dafuer gebautes Modell
 * (z. B. qwen3) vor der Antwort nach. Kann das Modell das nicht, wird ohne
 * Denkmodus wiederholt.
 */
async function askJson<T>(options: OllamaOptions, prompt: string): Promise<T> {
  const call = async (think: boolean) => fetch(`${options.url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      prompt,
      stream: false,
      format: 'json',
      think,
      keep_alive: '2m',
      options: { temperature: 0, seed: 42 }
    }),
    // Kalt geladen und mit Denkphase kann das neben dem Bildserver dauern
    signal: AbortSignal.timeout(300000)
  });

  let res = await call(options.think);
  if (!res.ok && options.think) res = await call(false);
  if (!res.ok) throw new Error(`Ollama antwortet mit ${res.status}`);
  const data = await res.json() as { response?: string };
  return JSON.parse(data.response || '{}') as T;
}

const clean = (text: string | undefined) => (text || '').trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');

export interface ScenePlan {
  event: string;
  photo: string;
  review: string;
}

/**
 * Bildprompt in zwei Schritten, beides auf Englisch, weil die lokalen Bildmodelle
 * Englisch am besten verstehen:
 *  1. Entwurf: Kernereignis der Schlagzeile bestimmen, dann das Foto beschreiben,
 *     das ein Pressefotograf dazu machen wuerde. Der Zwischenschritt verhindert,
 *     dass Nebendetails (etwa ein Requisit aus einer Filmhandlung) zum Motiv werden.
 *  2. Pruefung: Passt die Beschreibung zur Schlagzeile, ist nichts erfunden,
 *     keine Schrift, keine echten Gesichter? Wenn nicht, wird sie korrigiert.
 * Danach wird das Modell entladen (keep_alive 0), damit das Bildmodell Platz hat.
 */
export async function planScene(article: ImageArticle, settings: Record<string, string>): Promise<ScenePlan> {
  const options: OllamaOptions = {
    url: settings['ollamaUrl'] || process.env.OLLAMA_URL || 'http://localhost:11434',
    model: settings['imagePromptModel'] || settings['aiModel'] || 'qwen3:14b',
    think: settings['imagePromptThinking'] !== 'false'
  };

  const context = `Headline: ${article.title}
Summary: ${article.teaser || ''}
Beginning of article: ${(article.content || '').slice(0, 800)}`;

  const draft = await askJson<{ event?: string; photo?: string }>(options, `You are a photo editor at a news agency. Pick the cover photo for this German news article.

Step 1 "event": the core news of the HEADLINE in max. 12 English words (who/what, what happened).
Step 2 "photo": the photo a press photographer would take for exactly that event, one English sentence, 25 to 45 words.
Typical choices: the place where it happened, the affected object or building, people at work (seen from behind or far away),
a press conference room, a vehicle or machine involved, a film or stage production still for culture news.

Rules for "photo":
- Show the main subject of the headline. Do not use side details, quotes or plot elements from the text as the main subject.
- Only name a city or country if it appears in the article. Never invent places.
- No readable text, signs or logos. No close-up faces of real people. Nothing gory.

Answer as JSON: {"event": "...", "photo": "..."}

${context}`);

  const event = clean(draft.event);
  let photo = clean(draft.photo);
  if (photo.length < 20) throw new Error('Kein brauchbarer Entwurf');

  const review = await askJson<{ fits?: boolean; problems?: string; photo?: string }>(options, `You check photo briefs before they go to an image generator.

Core event: ${event}
Photo brief: ${photo}

${context}

Check the brief:
1. Would a reader immediately connect the photo to the headline? Is the main subject the core event, not a side detail?
2. Does it invent places, people or objects that are not in the article?
3. Does it ask for readable text, logos, close-up faces of real people or gore?
4. Is it one concrete, photographable scene?

If everything is fine, return the brief unchanged. Otherwise rewrite it (one English sentence, 25 to 45 words).
Answer as JSON: {"fits": true or false, "problems": "short reason or empty", "photo": "final brief"}`);

  const reviewed = clean(review.photo);
  if (reviewed.length >= 20) photo = reviewed;

  // Modell entladen, damit der Bildserver den Grafikspeicher bekommt
  fetch(`${options.url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: options.model, keep_alive: 0 })
  }).catch(() => {});

  const verdict = review.fits === false ? `korrigiert: ${clean(review.problems)}` : 'passt';
  logger.info(`Bildprompt fuer Artikel #${article.id}`, { event, photo, review: verdict });
  return { event, photo: photo.slice(0, 500), review: verdict };
}

async function describeScene(article: ImageArticle, settings: Record<string, string>): Promise<string> {
  try {
    return (await planScene(article, settings)).photo;
  } catch (err) {
    logger.warn(`Bildprompt ueber Ollama fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    return `Press photo for the news: ${article.title}`.slice(0, 500);
  }
}
