import { describe, it, expect } from 'vitest';
import { 
  stripHtml, 
  truncate, 
  parseKeyTakeaways, 
  estimateReadingTime,
  calculatePersonalizedScore,
  rankPersonalizedArticles,
  CATEGORY_SUBTAGS,
  autoExtractArticleMetadata
} from './utils';

describe('utils', () => {
  describe('stripHtml', () => {
    it('should strip simple HTML tags', () => {
      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });

    it('should return empty string for null or empty input', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle attributes and nested tags', () => {
      const html = '<div class="news-item"><a href="/test">Eilmeldung</a><span>: Text</span></div>';
      expect(stripHtml(html)).toBe('Eilmeldung: Text');
    });
  });

  describe('truncate', () => {
    it('should not truncate if string length is within limit', () => {
      expect(truncate('Short text', 50)).toBe('Short text');
    });

    it('should truncate string and append ellipsis if over limit', () => {
      expect(truncate('This is a longer headline that exceeds limit', 10)).toBe('This is a ...');
    });

    it('should handle empty input', () => {
      expect(truncate('')).toBe('');
    });
  });

  describe('parseKeyTakeaways', () => {
    it('should parse bullet-pointed strings into array', () => {
      const raw = '• Erster Kernpunkt\n• Zweiter Kernpunkt\n• Dritter Kernpunkt';
      const result = parseKeyTakeaways(raw);
      expect(result).toEqual([
        'Erster Kernpunkt',
        'Zweiter Kernpunkt',
        'Dritter Kernpunkt'
      ]);
    });

    it('should parse dash-separated or numbered points', () => {
      const raw = '1. Punkt Eins - Punkt Zwei • Punkt Drei';
      const result = parseKeyTakeaways(raw);
      expect(result).toEqual(['Punkt Eins', 'Punkt Zwei', 'Punkt Drei']);
    });

    it('should return empty array for empty or null input', () => {
      expect(parseKeyTakeaways('')).toEqual([]);
      expect(parseKeyTakeaways(null)).toEqual([]);
      expect(parseKeyTakeaways(undefined)).toEqual([]);
    });
  });

  describe('estimateReadingTime', () => {
    it('should return less than 1 min for short text', () => {
      expect(estimateReadingTime('Kurzer Teaser Text.')).toBe('1 Min Lesezeit');
    });

    it('should estimate reading time based on 200 wpm', () => {
      const words = new Array(450).fill('Nachricht').join(' ');
      expect(estimateReadingTime(words)).toBe('3 Min Lesezeit');
    });

    it('should handle empty or null text', () => {
      expect(estimateReadingTime('')).toBe('< 1 Min Lesezeit');
      expect(estimateReadingTime(null)).toBe('< 1 Min Lesezeit');
    });
  });

  describe('personalization', () => {
    const mockArticles = [
      {
        id: 1,
        title: 'Politik im Parlament',
        category: 'Politik',
        tags: [{ name: 'Nationalrat', slug: 'nationalrat' }],
        createdAt: '2026-09-16T10:00:00Z'
      },
      {
        id: 2,
        title: 'Neuer KI-Durchbruch in Leonding',
        category: 'Technologie',
        tags: [{ name: 'Künstliche Intelligenz', slug: 'ki' }, { name: 'Forschung', slug: 'forschung' }],
        createdAt: '2026-09-16T11:00:00Z'
      },
      {
        id: 3,
        title: 'Bundesliga Spitzenreiter siegt',
        category: 'Sport',
        tags: [{ name: 'Fußball', slug: 'fussball' }],
        createdAt: '2026-09-16T09:00:00Z'
      }
    ];

    it('should return cold-start order when user has no interest history', () => {
      const ranked = rankPersonalizedArticles(mockArticles, {});
      expect(ranked.map(a => a.id)).toEqual([1, 2, 3]);
    });

    it('should prioritize articles matching user category interests', () => {
      const userInterests = {
        categories: { 'Sport': 5, 'Politik': 1 }
      };
      const ranked = rankPersonalizedArticles(mockArticles, userInterests);
      expect(ranked[0].id).toBe(3); // Sport article first
      expect(ranked[1].id).toBe(1); // Politik article second
      expect(ranked[2].id).toBe(2); // Technologie article last
    });

    it('should give high weight to matched tags in personalization score', () => {
      const userInterests = {
        tags: { 'ki': 4 }
      };
      const ranked = rankPersonalizedArticles(mockArticles, userInterests);
      expect(ranked[0].id).toBe(2); // KI article ranked #1
    });

    it('should calculate combined category and tag affinity score with recency', () => {
      const userInterests = {
        categories: { 'Technologie': 2 },
        tags: { 'ki': 3 }
      };
      // Score = 2*3 (category) + 3*5 (tag) + recency boost
      const score = calculatePersonalizedScore(mockArticles[1], userInterests);
      expect(score).toBeGreaterThan(20);
    });
  });

  describe('autoExtractArticleMetadata and category subtags', () => {
    it('should have predefined subtags for all main categories', () => {
      expect(CATEGORY_SUBTAGS['Politik']).toBeDefined();
      expect(CATEGORY_SUBTAGS['Politik'].some(s => s.name === 'Innenpolitik')).toBe(true);
      expect(CATEGORY_SUBTAGS['Politik'].some(s => s.name === 'Außenpolitik')).toBe(true);
      expect(CATEGORY_SUBTAGS['Wirtschaft'].some(s => s.name === 'Finanzen')).toBe(true);
      expect(CATEGORY_SUBTAGS['Technologie'].some(s => s.name === 'KI & Algorithmen')).toBe(true);
    });

    it('should extract a clean auto-title and strip agency prefixes', () => {
      const text = 'WIEN (APA) - Nationalrat beschließt neues Transparenzgesetz nach stundenlanger Debatte im Plenum.';
      const meta = autoExtractArticleMetadata(text);
      expect(meta.title).toBe('Nationalrat beschließt neues Transparenzgesetz nach stundenlanger Debatte im Plenum');
      expect(meta.category).toBe('Politik');
      expect(meta.tags.some(t => t.name === 'Innenpolitik')).toBe(true);
    });

    it('should automatically assign Wirtschaft and Finanzen subtags for financial content', () => {
      const text = 'Die Europäische Zentralbank erhöht überraschend den Leitzins, um die anhaltende Inflation im Euroraum zu dämpfen.';
      const meta = autoExtractArticleMetadata(text);
      expect(meta.category).toBe('Wirtschaft');
      expect(meta.tags.some(t => t.name === 'Finanzen' || t.name === 'Inflation & Preise')).toBe(true);
    });

    it('should automatically assign Technologie and KI subtags for AI content', () => {
      const text = 'Neues Open-Source Sprachmodell übertrifft bisherige Algorithmen bei der automatischen Codegenerierung.';
      const meta = autoExtractArticleMetadata(text);
      expect(meta.category).toBe('Technologie');
      expect(meta.tags.some(t => t.name === 'KI & Algorithmen' || t.name === 'Software & Cloud')).toBe(true);
    });

    it('should respect explicit categoryHint when provided', () => {
      const text = 'Das neue Budget des Kulturministers sieht höhere Förderungen für freie Theater und Festspiele vor.';
      const meta = autoExtractArticleMetadata(text, 'Kultur');
      expect(meta.category).toBe('Kultur');
      expect(meta.tags.some(t => t.name === 'Theater & Bühne')).toBe(true);
    });
  });
});
