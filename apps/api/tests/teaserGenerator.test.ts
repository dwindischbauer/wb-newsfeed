import { describe, it, expect } from 'vitest';
import { OllamaTeaserGenerator } from '../src/services/teaserGenerator.service.js';

describe('OllamaTeaserGenerator', () => {
  it('should fall back gracefully when Ollama service is unreachable', async () => {
    const generator = new OllamaTeaserGenerator();
    const result = await generator.generateTeaser(
      'Test Artikel Überschrift',
      'Dies ist ein Testinhalt für den Vitest Unit Test.'
    );

    expect(result).toBeDefined();
    expect(result.headline).toBe('Test Artikel Überschrift');
    expect(result.language).toBe('de');
    expect(result.sentiment).toBe('neutral');
  });
});
