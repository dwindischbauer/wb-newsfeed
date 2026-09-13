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

export interface UserInterests {
  categories?: Record<string, number>;
  tags?: Record<string, number>;
}

export interface ScorableArticle {
  id: number;
  category?: string;
  tags?: Array<{ name: string; slug?: string }>;
  createdAt?: string | Date | null;
  [key: string]: any;
}

export const calculatePersonalizedScore = (
  article: ScorableArticle,
  interests: UserInterests = {},
  now: number = Date.now()
): number => {
  let score = 0;

  if (article.category && interests.categories) {
    const catReads = interests.categories[article.category] || 0;
    score += catReads * 3;
  }

  if (Array.isArray(article.tags) && interests.tags) {
    for (const tag of article.tags) {
      const tagName = (tag.slug || tag.name || '').toLowerCase();
      const tagReads = interests.tags[tagName] || 0;
      score += tagReads * 5;
    }
  }

  if (article.createdAt) {
    const createdTime = new Date(article.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const hoursOld = Math.max(0, (now - createdTime) / (1000 * 60 * 60));
      if (hoursOld < 24) {
        score += Math.max(0, 2 - (hoursOld / 12));
      }
    }
  }

  return score;
};

export const rankPersonalizedArticles = <T extends ScorableArticle>(
  articles: T[],
  interests: UserInterests = {}
): T[] => {
  if (!articles || articles.length === 0) return [];
  const hasInterests = (interests.categories && Object.keys(interests.categories).length > 0) ||
                       (interests.tags && Object.keys(interests.tags).length > 0);

  if (!hasInterests) {
    return [...articles];
  }

  const now = Date.now();
  return [...articles].sort((a, b) => {
    const scoreA = calculatePersonalizedScore(a, interests, now);
    const scoreB = calculatePersonalizedScore(b, interests, now);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
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
    if (firstSentenceMatch) {
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
  if (matchedTags.length === 0 && relevantSubtags.length > 0) {
    matchedTags.push({
      name: relevantSubtags[0].name,
      slug: relevantSubtags[0].slug,
      color: relevantSubtags[0].color
    });
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

