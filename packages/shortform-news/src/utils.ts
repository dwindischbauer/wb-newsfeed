export const truncate = (str: string, length: number = 100): string => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

export const parseKeyTakeaways = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  // Aeltere Eintraege koennen ein JSON-Array als Text enthalten
  if (raw.trim().startsWith('[')) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list.map((p) => String(p).trim()).filter((p) => p.length > 0);
    } catch {
      // kein gueltiges JSON, normal weiter
    }
  }
  return raw
    .split(/(?:\n|[,;]?\s*(?:•|-|\*|\d+\.)\s+)/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
};

export const estimateReadingTime = (text: string | null | undefined, wordsPerMinute: number = 200): string => {
  if (!text) return '< 1 Min Lesezeit';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} Min Lesezeit`;
};

// Relative Pfade wie /images/x.jpg liegen auf der API, absolute URLs bleiben unveraendert
export const resolveImageUrl = (imageUrl: string | null | undefined, apiUrl = ''): string | null => {
  if (!imageUrl) return null;
  if (/^(https?:)?\/\//.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  const base = apiUrl.replace(/\/$/, '');
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

export const formatEngagementCount = (n: number | undefined | null): string => {
  const val = n || 0;
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(val);
};


export interface ArticleTag {
  id?: number | string;
  name: string;
  slug?: string;
  color?: string;
}

export interface Article {
  id: number;
  title: string;
  teaser?: string | null;
  content?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  category?: string;
  tags?: ArticleTag[];
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  createdAt?: string | Date | null;
  keyTakeaways?: string | null;
  status?: string;
  /** Inhaltlich aehnliche Artikel (Embeddings, berechnet von der API) */
  related?: Array<{ id: number; score: number }>;
  /** Wie oft der Artikel geoeffnet wurde */
  readCount?: number | null;
}

/**
 * Appends a newly loaded page, skipping IDs already in the list: offsets
 * shift when articles get published between two page requests.
 */
export const appendUniqueArticles = <T extends { id: number }>(current: T[], page: T[]): T[] => {
  const seen = new Set(current.map((a) => a.id));
  return [...current, ...page.filter((a) => !seen.has(a.id))];
};

export interface SubtagDefinition {
  name: string;
  slug: string;
  color: string;
  keywords: string[];
}

export const CATEGORY_SUBTAGS: Record<string, SubtagDefinition[]> = {
  Politik: [
    { name: 'Innenpolitik', slug: 'innenpolitik', color: '#ef4444', keywords: ['nationalrat', 'regierung', 'kanzler', 'nehammer', 'koalition', 'parlament', 'fpö', 'övp', 'spö', 'grüne', 'neos', 'landtag', 'minister', 'wien', 'bundesrat', 'inland', 'parteien'] },
    { name: 'Außenpolitik', slug: 'aussenpolitik', color: '#3b82f6', keywords: ['eu', 'brüssel', 'usa', 'diplomatie', 'nato', 'uno', 'botschafter', 'ausland', 'gaza', 'ukraine', 'krieg', 'frieden', 'abkommen', 'staatsbesuch', 'präsident'] },
    { name: 'EU-Politik', slug: 'eu-politik', color: '#2563eb', keywords: ['eu', 'brüssel', 'kommission', 'von der leyen', 'straßburg', 'eu-parlament', 'mitgliedsstaaten', 'eu-richtlinie', 'europäisch'] },
    { name: 'Wahlen', slug: 'wahlen', color: '#dc2626', keywords: ['wahl', 'wahlen', 'umfrage', 'stimmen', 'spitzenkandidat', 'wahlergebnis', 'hochrechnung', 'stimmzettel', 'wahlkampf'] },
    { name: 'Justiz & Recht', slug: 'justiz-recht', color: '#b91c1c', keywords: ['gericht', 'justiz', 'urteil', 'klage', 'staatsanwaltschaft', 'verfassung', 'gesetz', 'anwalt', 'prozess', 'strafrecht', 'höchstgericht'] }
  ],
  Wirtschaft: [
    { name: 'Finanzen', slug: 'finanzen', color: '#10b981', keywords: ['finanz', 'bank', 'kredit', 'zinsen', 'anleihen', 'währung', 'euro', 'dollar', 'investition', 'sparer'] },
    { name: 'Börse & Märkte', slug: 'boerse-maerkte', color: '#059669', keywords: ['börse', 'aktie', 'aktien', 'index', 'atx', 'dax', 'wall street', 'handelsplatz', 'dividende', 'fonds', 'wertpapiere'] },
    { name: 'Unternehmen', slug: 'unternehmen', color: '#047857', keywords: ['unternehmen', 'konzern', 'firma', 'umsatz', 'gewinn', 'fusion', 'industrie', 'produktion', 'ceos', 'quartalszahlen', 'wirtschaftsbund'] },
    { name: 'Inflation & Preise', slug: 'inflation-preise', color: '#d97706', keywords: ['inflation', 'teuerung', 'preise', 'verbraucherpreis', 'lebensmittel', 'ezb', 'kaufkraft', 'energiepreise'] },
    { name: 'Arbeitsmarkt', slug: 'arbeitsmarkt', color: '#0d9488', keywords: ['arbeitslos', 'arbeitsmarkt', 'ams', 'beschäftigung', 'jobs', 'fachkräfte', 'gewerkschaft', 'kollektivvertrag', 'lohn'] },
    { name: 'Energie & Rohstoffe', slug: 'energie-rohstoffe', color: '#0284c7', keywords: ['energie', 'gas', 'öl', 'strom', 'strompreis', 'kraftwerk', 'erneuerbare', 'solar', 'windkraft', 'netz'] }
  ],
  Sport: [
    { name: 'Fußball', slug: 'fussball', color: '#f59e0b', keywords: ['fußball', 'fussball', 'bundesliga', 'champions league', 'öfb', 'nationalteam', 'tor', 'trainer', 'meister', 'stürmer', 'transfer', 'rapid', 'salzburg', 'sturm graz'] },
    { name: 'Wintersport', slug: 'wintersport', color: '#0ea5e9', keywords: ['ski', 'abfahrt', 'slalom', 'kitzbühel', 'weltcup', 'schnee', 'skispringen', 'biathlon', 'alpen', 'hirscher'] },
    { name: 'Formel 1', slug: 'formel-1', color: '#dc2626', keywords: ['formel 1', 'f1', 'verstappen', 'hamilton', 'red bull racing', 'ferrari', 'grand prix', 'rennstrecke', 'motorsport', 'qualifying'] },
    { name: 'Tennis', slug: 'tennis', color: '#84cc16', keywords: ['tennis', 'grand slam', 'wimbledon', 'roland garros', 'thiem', 'atp', 'wta', 'aufschlag', 'matchball'] }
  ],
  Technologie: [
    { name: 'KI & Algorithmen', slug: 'ki-algorithmen', color: '#8b5cf6', keywords: ['ki', 'künstliche intelligenz', 'llm', 'openai', 'chatgpt', 'sprachmodell', 'deep learning', 'machine learning', 'robotik', 'neuronale netze'] },
    { name: 'Software & Cloud', slug: 'software-cloud', color: '#6366f1', keywords: ['software', 'cloud', 'app', 'code', 'entwickler', 'open source', 'rechenzentrum', 'aws', 'microsoft', 'google', 'leonding', 'it'] },
    { name: 'Cybersecurity', slug: 'cybersecurity', color: '#ec4899', keywords: ['cyber', 'hacker', 'sicherheit', 'schadsoftware', 'angriff', 'datenschutz', 'verschlüsselung', 'firewall', 'phishing'] },
    { name: 'Hardware & Chips', slug: 'hardware-chips', color: '#a855f7', keywords: ['chip', 'halbleiter', 'prozessor', 'nvidia', 'intel', 'smartphone', 'gadget', 'hardware', 'quantencomputer'] }
  ],
  Kultur: [
    { name: 'Film & Kino', slug: 'film-kino', color: '#d946ef', keywords: ['film', 'kino', 'regisseur', 'schauspieler', 'oscar', 'festival', 'premiere', 'serie', 'hollywood', 'leinwand'] },
    { name: 'Musik', slug: 'musik', color: '#c026d3', keywords: ['musik', 'konzert', 'album', 'sänger', 'orchester', 'oper', 'band', 'tournee', 'song', 'philharmoniker'] },
    { name: 'Theater & Bühne', slug: 'theater-buehne', color: '#9333ea', keywords: ['theater', 'bühne', 'burgtheater', 'festspiele', 'darsteller', 'premiere', 'aufführung', 'inszenierung', 'schauspielhaus'] },
    { name: 'Literatur & Kunst', slug: 'literatur-kunst', color: '#7c3aed', keywords: ['buch', 'roman', 'autor', 'schriftsteller', 'kunst', 'ausstellung', 'museum', 'galerie', 'gemälde', 'skulptur'] }
  ],
  Chronik: [
    { name: 'Kriminalität', slug: 'kriminalitaet', color: '#475569', keywords: ['polizei', 'festnahme', 'mord', 'messer', 'diebstahl', 'betrug', 'prozess', 'verdächtig', 'ermittlungen', 'anschlag'] },
    { name: 'Unfälle & Unglücke', slug: 'unfaelle', color: '#64748b', keywords: ['unfall', 'absturz', 'brand', 'feuerwehr', 'verletzt', 'tote', 'explosion', 'einsturz', 'rettung'] },
    { name: 'Wetter & Umwelt', slug: 'wetter-umwelt', color: '#0f766e', keywords: ['unwetter', 'hochwasser', 'hagel', 'sturm', 'hitze', 'klima', 'lawine', 'erdbeben', 'waldbrand'] },
    { name: 'Gesundheit', slug: 'gesundheit', color: '#0891b2', keywords: ['spital', 'krankenhaus', 'arzt', 'patient', 'virus', 'impfung', 'pflege', 'gesundheit', 'medizin'] }
  ]
};

export interface ExtractedMetadata {
  title: string;
  category: string;
  tags: Array<{ name: string; slug: string; color?: string }>;
  teaser: string;
  keyTakeaways: string;
}

function matchesKeyword(text: string, kw: string): boolean {
  if (kw.length <= 3) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zäöü0-9])${escaped}([^a-zäöü0-9]|$)`, 'i');
    return regex.test(text);
  }
  return text.includes(kw);
}

export function autoExtractArticleMetadata(text: string, categoryHint: string = 'Auto'): ExtractedMetadata {
  const clean = stripHtml(text || '').trim();
  if (!clean) {
    return {
      title: 'Neuer Nachrichtenartikel',
      category: categoryHint === 'Auto' ? 'Allgemein' : categoryHint,
      tags: [],
      teaser: '',
      keyTakeaways: ''
    };
  }

  // 1. Intelligent Auto-Title Extraction
  // Split into lines or sentences to find the primary headline
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  
  let headlineCandidate = firstLine;
  // If first line is very long, extract the first sentence (avoiding decimals like 0.25)
  if (headlineCandidate.length > 100 || /[.?!]/.test(headlineCandidate)) {
    const firstSentenceMatch = headlineCandidate.match(/^((?:[0-9]+\.[0-9]+|[^.?!])+[.?!]?)/);
    if (firstSentenceMatch?.[1]) {
      headlineCandidate = firstSentenceMatch[1].trim();
    }
  }

  // Strip journalistic location/agency prefixes (e.g. "WIEN (APA) - ", "BRÜSSEL.", "Eilmeldung: ")
  headlineCandidate = headlineCandidate
    .replace(/^(?:EILMELDUNG|BREAKING|UPDATE|EXKLUSIV)[:\s-]+/i, '')
    .replace(/^[A-ZÄÖÜa-zäöü\s\/\.-]+(?:\(APA[^\)]*\)|\(Reuters\)|\(dpa\)|\(AFP\))[:\s-]+/i, '')
    .replace(/^[A-ZÄÖÜ\s]{2,15}\s*[-–.]\s*/, '')
    .replace(/\s*[–-]\s*APA\b/i, '')
    .trim();

  // Strip trailing periods from titles
  headlineCandidate = headlineCandidate.replace(/[.:]+$/, '').trim();

  // Limit headline length at word boundary
  if (headlineCandidate.length > 95) {
    const trimmed = headlineCandidate.slice(0, 92);
    const lastSpace = trimmed.lastIndexOf(' ');
    headlineCandidate = (lastSpace > 45 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
  }

  if (!headlineCandidate || headlineCandidate.length < 5) {
    headlineCandidate = truncate(clean, 60).replace(/[.]+$/, '');
  }

  // 2. Intelligent Category Determination
  const lower = clean.toLowerCase();
  let detectedCategory = categoryHint;

  if (!detectedCategory || detectedCategory === 'Auto' || detectedCategory === 'Alle') {
    const catScores: Record<string, number> = {
      Politik: 0,
      Wirtschaft: 0,
      Sport: 0,
      Technologie: 0,
      Kultur: 0
    };

    for (const [cat, sublist] of Object.entries(CATEGORY_SUBTAGS)) {
      for (const sub of sublist) {
        for (const kw of sub.keywords) {
          if (matchesKeyword(lower, kw)) {
            catScores[cat] = (catScores[cat] || 0) + (kw.length > 4 ? 2 : 1);
          }
        }
      }
    }

    const topCat = Object.entries(catScores).sort((a, b) => b[1] - a[1])[0];
    detectedCategory = topCat && topCat[1] > 0 ? topCat[0] : 'Politik';
  }

  // 3. Automatic Subtag Matching
  const matchedTags: Array<{ name: string; slug: string; color: string }> = [];
  const assignedNames = new Set<string>();

  // Prioritize subtags from the detected category
  const relevantSubtags = CATEGORY_SUBTAGS[detectedCategory] || [];
  for (const sub of relevantSubtags) {
    let matchCount = 0;
    for (const kw of sub.keywords) {
      if (matchesKeyword(lower, kw)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      matchedTags.push({ name: sub.name, slug: sub.slug, color: sub.color });
      assignedNames.add(sub.name);
    }
  }

  // If we have fewer than 2 tags, check cross-category subtags
  if (matchedTags.length < 2) {
    for (const [cat, sublist] of Object.entries(CATEGORY_SUBTAGS)) {
      if (cat === detectedCategory) continue;
      for (const sub of sublist) {
        if (assignedNames.has(sub.name)) continue;
        let strongMatch = 0;
        for (const kw of sub.keywords) {
          if (matchesKeyword(lower, kw)) {
            strongMatch++;
          }
        }
        if (strongMatch >= 2) {
          matchedTags.push({ name: sub.name, slug: sub.slug, color: sub.color });
          assignedNames.add(sub.name);
          if (matchedTags.length >= 3) break;
        }
      }
      if (matchedTags.length >= 3) break;
    }
  }

  // Always ensure at least one primary tag
  const firstSubtag = relevantSubtags[0];
  if (matchedTags.length === 0 && firstSubtag) {
    matchedTags.push({ name: firstSubtag.name, slug: firstSubtag.slug, color: firstSubtag.color });
  }

  // 4. Concise Teaser and Key Takeaways
  const sentences = clean.match(/(?:[0-9]+\.[0-9]+|[^.!?])+[.!?]+/g) || [clean];
  const teaserSentences = sentences.slice(0, 2).map(s => s.trim()).join(' ');
  const teaser = truncate(teaserSentences || clean, 160);

  const takeawaysList = sentences.slice(0, 3).map(s => `• ${s.trim().replace(/^[-•*]\s*/, '')}`);
  const keyTakeaways = takeawaysList.length > 0 ? takeawaysList.join('\n') : `• ${headlineCandidate}`;

  return {
    title: headlineCandidate,
    category: detectedCategory,
    tags: matchedTags.slice(0, 4),
    teaser,
    keyTakeaways
  };
}
