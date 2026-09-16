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
