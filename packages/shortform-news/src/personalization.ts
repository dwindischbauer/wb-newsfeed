/**
 * "Fuer dich": lernt aus dem Verhalten auf dem Geraet, ohne Konto und ohne
 * dass ein Profil den Browser verlaesst. Gespeichert wird nur, welche
 * Kategorien, Tags und Artikel wie stark interessiert haben.
 *
 * Signale (Gewicht):
 *   schnell weggewischt (< 1,5 s)      -0,6
 *   angesehen (4 bis 10 s)             +0,4
 *   laenger angesehen (ab 10 s)        +1
 *   Artikel geoeffnet                  +2
 *   Artikel gelesen (ab 30 s offen)    +3
 *   Like / Unlike                      +3 / -3
 *   Kommentar, Teilen                  +4
 *
 * Alle Werte verfallen mit einer Halbwertszeit von drei Tagen, damit alte
 * Interessen neuen Platz machen.
 */

export interface RelatedRef {
  id: number;
  score: number;
}

export interface RankableArticle {
  id: number;
  category?: string;
  tags?: Array<{ name: string; slug?: string }>;
  createdAt?: string | Date | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  readCount?: number | null;
  related?: RelatedRef[];
}

export interface InterestProfile {
  categories: Record<string, number>;
  tags: Record<string, number>;
  /** Interesse an einzelnen Artikeln, wirkt ueber `related` auf aehnliche Artikel */
  articles: Record<string, number>;
  /** Zeitpunkt, an dem ein Artikel zuletzt wirklich angesehen wurde */
  seen: Record<string, number>;
  signals: number;
  updatedAt: number;
}

export type SignalType = 'skip' | 'view' | 'dwell' | 'open' | 'read' | 'like' | 'unlike' | 'comment' | 'share';

export const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  skip: -0.6,
  view: 0.4,
  dwell: 1,
  open: 2,
  read: 3,
  like: 3,
  unlike: -3,
  comment: 4,
  share: 4
};

const HALF_LIFE_MS = 3 * 24 * 60 * 60 * 1000;
const FRESHNESS_HALF_LIFE_H = 24;
const MAX_VALUE = 30;

// Gewichtung der Bestandteile im Score
const W_CATEGORY = 3;
const W_TAGS = 2;
const W_SIMILAR = 3;
const W_FRESH = 1.5;
const W_POPULAR = 0.7;
const SEEN_PENALTY = 2.5;
const OPENED_PENALTY = 4;
// Abzug je nachdem, wie viele der letzten drei Plaetze dieselbe Kategorie hatten:
// bis zu drei Artikel eines Themas hintereinander sind moeglich, ein vierter kaum
const REPEAT_PENALTY = [0, 0.3, 1.2, 6];
/** Jede n-te Position zeigt bewusst etwas ausserhalb der bisherigen Interessen */
const EXPLORE_EVERY = 5;

export const createProfile = (now = Date.now()): InterestProfile => ({
  categories: {},
  tags: {},
  articles: {},
  seen: {},
  signals: 0,
  updatedAt: now
});

/** Ordnet eine Verweildauer auf einer Karte einem Signal zu (oder keinem). */
export const dwellSignal = (seconds: number): SignalType | null => {
  if (seconds < 1.5) return 'skip';
  if (seconds < 4) return null;
  if (seconds < 10) return 'view';
  return 'dwell';
};

const tagKey = (t: { name: string; slug?: string }) => (t.slug || t.name || '').toLowerCase();

const clamp = (v: number) => Math.max(-MAX_VALUE, Math.min(MAX_VALUE, v));

function decayMap(map: Record<string, number>, factor: number) {
  for (const key of Object.keys(map)) {
    const value = map[key]! * factor;
    if (Math.abs(value) < 0.05) delete map[key];
    else map[key] = value;
  }
}

/** Laesst alle Interessen seit der letzten Aenderung verfallen. */
export function decayProfile(profile: InterestProfile, now = Date.now()): InterestProfile {
  const elapsed = Math.max(0, now - profile.updatedAt);
  if (elapsed > 0) {
    const factor = Math.pow(0.5, elapsed / HALF_LIFE_MS);
    decayMap(profile.categories, factor);
    decayMap(profile.tags, factor);
    decayMap(profile.articles, factor);
  }
  profile.updatedAt = now;
  return profile;
}

export function applySignal(
  profile: InterestProfile,
  article: RankableArticle,
  signal: SignalType,
  now = Date.now()
): InterestProfile {
  decayProfile(profile, now);
  const weight = SIGNAL_WEIGHTS[signal];

  if (article.category) {
    profile.categories[article.category] = clamp((profile.categories[article.category] || 0) + weight);
  }
  for (const tag of article.tags || []) {
    const key = tagKey(tag);
    if (key) profile.tags[key] = clamp((profile.tags[key] || 0) + weight * 1.2);
  }
  profile.articles[article.id] = clamp((profile.articles[article.id] || 0) + weight);
  if (signal !== 'skip') profile.seen[article.id] = now;
  profile.signals++;
  return profile;
}

/** Ein Artikel wurde angesehen, egal wie lange. Er rutscht beim naechsten Mal nach hinten. */
export function markSeen(profile: InterestProfile, articleId: number, now = Date.now()) {
  profile.seen[articleId] = now;
}

const maxAbs = (values: number[]) => values.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;

export interface ScoreContext {
  now: number;
  maxPopularity: number;
}

function popularity(a: RankableArticle): number {
  return (a.likeCount || 0) + 2 * (a.commentCount || 0) + 2 * (a.shareCount || 0) + (a.readCount || 0);
}

export interface ScoreParts {
  category: number;
  tags: number;
  similar: number;
  fresh: number;
  popular: number;
  seen: number;
  total: number;
}

/** Score eines Artikels, in Einzelteile zerlegt (fuer Tests und zum Nachvollziehen). */
export function scoreArticle(article: RankableArticle, profile: InterestProfile, ctx: ScoreContext): ScoreParts {
  const catNorm = maxAbs(Object.values(profile.categories));
  const tagNorm = maxAbs(Object.values(profile.tags));
  const articleNorm = maxAbs(Object.values(profile.articles));

  const category = article.category ? (profile.categories[article.category] || 0) / catNorm : 0;

  const tagValues = (article.tags || []).map((t) => (profile.tags[tagKey(t)] || 0) / tagNorm);
  const tags = tagValues.length ? Math.max(...tagValues) * 0.7 + (tagValues.reduce((s, v) => s + v, 0) / tagValues.length) * 0.3 : 0;

  // Aehnlich zu Artikeln, die interessiert (oder gelangweilt) haben
  let similar = 0;
  for (const rel of article.related || []) {
    const interest = profile.articles[rel.id];
    if (interest) similar += (interest / articleNorm) * rel.score;
  }
  similar = Math.max(-1, Math.min(1, similar));

  let fresh = 0;
  if (article.createdAt) {
    const ageHours = Math.max(0, (ctx.now - new Date(article.createdAt).getTime()) / 3_600_000);
    if (Number.isFinite(ageHours)) fresh = Math.pow(0.5, ageHours / FRESHNESS_HALF_LIFE_H);
  }

  const popular = ctx.maxPopularity > 0 ? Math.log1p(popularity(article)) / Math.log1p(ctx.maxPopularity) : 0;

  const opened = (profile.articles[article.id] || 0) >= SIGNAL_WEIGHTS.open;
  const seen = profile.seen[article.id] ? (opened ? -OPENED_PENALTY : -SEEN_PENALTY) : 0;

  const total =
    W_CATEGORY * category + W_TAGS * tags + W_SIMILAR * similar + W_FRESH * fresh + W_POPULAR * popular + seen;
  return { category, tags, similar, fresh, popular, seen, total };
}

/**
 * Sortiert fuer "Fuer dich". Waehlt Schritt fuer Schritt den besten Artikel,
 * bestraft dabei eine Kategorie, die schon mehrmals direkt davor kam, und setzt
 * auf jede fuenfte Position den besten Artikel aus einer bisher wenig
 * beachteten Kategorie. Ohne Signale bestimmen Aktualitaet und Beliebtheit.
 */
export function rankForYou<T extends RankableArticle>(
  articles: T[],
  profile: InterestProfile,
  options: { now?: number; previous?: T[] } = {}
): T[] {
  if (articles.length === 0) return [];
  const now = options.now ?? Date.now();
  const ctx: ScoreContext = { now, maxPopularity: Math.max(0, ...articles.map(popularity)) };
  const scored = articles.map((a) => ({ a, score: scoreArticle(a, profile, ctx).total }));

  const learned = profile.signals >= 3;
  const result: T[] = [];
  const recentCategories = (options.previous || []).slice(-3).map((a) => a.category);
  let position = (options.previous || []).length;

  while (scored.length > 0) {
    position++;
    let pick = -1;

    if (learned && position % EXPLORE_EVERY === 0) {
      // Erkundung: frischester Artikel aus der Kategorie mit dem geringsten Interesse
      let lowest = Infinity;
      scored.forEach((s, i) => {
        const interest = profile.categories[s.a.category || ''] || 0;
        const key = interest - s.score * 0.01;
        if (!profile.seen[s.a.id] && key < lowest) {
          lowest = key;
          pick = i;
        }
      });
    }

    if (pick < 0) {
      let best = -Infinity;
      scored.forEach((s, i) => {
        const repeats = recentCategories.filter((c) => c && c === s.a.category).length;
        const adjusted = s.score - REPEAT_PENALTY[repeats]!;
        const newer = best === adjusted && pick >= 0
          && new Date(s.a.createdAt ?? 0).getTime() > new Date(scored[pick]!.a.createdAt ?? 0).getTime();
        if (adjusted > best || newer) {
          best = adjusted;
          pick = i;
        }
      });
    }

    const [chosen] = scored.splice(pick, 1);
    result.push(chosen!.a);
    recentCategories.push(chosen!.a.category);
    if (recentCategories.length > 3) recentCategories.shift();
  }
  return result;
}

/**
 * Behaelt die ersten `fixedCount` Artikel der bisherigen Reihenfolge (was schon
 * gesehen oder gerade sichtbar ist) und sortiert alles dahinter neu.
 * So reagiert der Feed sofort auf ein Like, ohne unter dem Daumen zu springen.
 */
export function rerankTail<T extends RankableArticle>(
  current: T[],
  articles: T[],
  profile: InterestProfile,
  fixedCount: number,
  now = Date.now()
): T[] {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const head = current.slice(0, Math.max(0, fixedCount)).flatMap((a) => {
    const fresh = byId.get(a.id);
    return fresh ? [fresh] : [];
  });
  const headIds = new Set(head.map((a) => a.id));
  const tail = rankForYou(articles.filter((a) => !headIds.has(a.id)), profile, { now, previous: head });
  return [...head, ...tail];
}

/** Liest ein gespeichertes Profil, uebernimmt auch das alte Format (nur Kategorien/Tags). */
export function parseProfile(raw: string | null, legacy?: string | null, now = Date.now()): InterestProfile {
  const profile = createProfile(now);
  try {
    if (raw) {
      const data = JSON.parse(raw) as Partial<InterestProfile>;
      return {
        ...profile,
        ...data,
        categories: data.categories || {},
        tags: data.tags || {},
        articles: data.articles || {},
        seen: data.seen || {}
      };
    }
    if (legacy) {
      const old = JSON.parse(legacy) as { categories?: Record<string, number>; tags?: Record<string, number> };
      profile.categories = old.categories || {};
      profile.tags = old.tags || {};
      profile.signals = Object.keys(profile.categories).length;
    }
  } catch {
    // kaputter Eintrag: mit leerem Profil weiter
  }
  return profile;
}

/** Haelt das Profil klein: nur die juengsten 300 gesehenen Artikel bleiben. */
export function compactProfile(profile: InterestProfile): InterestProfile {
  const seen = Object.entries(profile.seen).sort((a, b) => b[1] - a[1]).slice(0, 300);
  profile.seen = Object.fromEntries(seen);
  const articles = Object.entries(profile.articles).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 300);
  profile.articles = Object.fromEntries(articles);
  return profile;
}
