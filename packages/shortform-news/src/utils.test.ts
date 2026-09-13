import { describe, it, expect } from 'vitest';
import { stripHtml, truncate, parseKeyTakeaways, estimateReadingTime } from './utils';

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
});
