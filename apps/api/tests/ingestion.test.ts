import { describe, it, expect } from 'vitest';
import { StandardCMSAdapter } from '../src/adapters/ingestion.adapter.js';
import { CMSPollingAdapter } from '../src/adapters/polling-adapter.example.js';

describe('Ingestion Adapters', () => {
  it('StandardCMSAdapter should validate valid payloads', () => {
    const adapter = new StandardCMSAdapter();
    const result = adapter.normalize({
      title: 'Valid Title',
      content: 'This is a sufficiently long content body.',
      author: 'Tester',
    });

    expect(result.title).toBe('Valid Title');
    expect(result.author).toBe('Tester');
  });

  it('CMSPollingAdapter should normalize raw CMS data', () => {
    const adapter = new CMSPollingAdapter('http://cms.example.com');
    const result = adapter.normalize({
      id: 42,
      title: { rendered: 'Dynamic Title' },
      content: { rendered: 'Dynamic Content Body Here' },
    });

    expect(result.externalId).toBe('42');
    expect(result.title).toBe('Dynamic Title');
  });
});
