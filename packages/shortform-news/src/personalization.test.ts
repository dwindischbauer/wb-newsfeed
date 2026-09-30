import { describe, it, expect } from 'vitest';
import {
  applySignal,
  createProfile,
  dwellSignal,
  decayProfile,
  parseProfile,
  rankForYou,
  rerankTail,
  scoreArticle,
  type RankableArticle
} from './personalization';

const NOW = new Date('2026-09-29T12:00:00Z').getTime();
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

const politik: RankableArticle = { id: 1, category: 'Politik', tags: [{ name: 'Nationalrat', slug: 'nationalrat' }], createdAt: hoursAgo(2) };
const tram: RankableArticle = { id: 2, category: 'Politik', tags: [{ name: 'Verkehr', slug: 'verkehr' }], createdAt: hoursAgo(3), related: [{ id: 5, score: 0.8 }] };
const sport: RankableArticle = { id: 3, category: 'Sport', tags: [{ name: 'Fußball', slug: 'fussball' }], createdAt: hoursAgo(1) };
const tech: RankableArticle = { id: 4, category: 'Technologie', tags: [{ name: 'KI', slug: 'ki' }], createdAt: hoursAgo(4), likeCount: 40 };
const bus: RankableArticle = { id: 5, category: 'Wirtschaft', tags: [], createdAt: hoursAgo(5), related: [{ id: 2, score: 0.8 }] };
const all = [politik, tram, sport, tech, bus];

describe('personalization', () => {
  it('maps dwell time to signals', () => {
    expect(dwellSignal(0.8)).toBe('skip');
    expect(dwellSignal(3)).toBeNull();
    expect(dwellSignal(6)).toBe('view');
    expect(dwellSignal(25)).toBe('dwell');
  });

  it('ranks by freshness and popularity without any signals', () => {
    const order = rankForYou(all, createProfile(NOW), { now: NOW }).map((a) => a.id);
    // Sport ist am frischesten, Technik am beliebtesten
    expect(order.slice(0, 2).sort()).toEqual([3, 4]);
  });

  it('puts a liked category first', () => {
    const profile = createProfile(NOW);
    applySignal(profile, sport, 'like', NOW);
    applySignal(profile, sport, 'dwell', NOW);
    applySignal(profile, sport, 'open', NOW);
    const other: RankableArticle = { id: 6, category: 'Sport', tags: [{ name: 'Fußball', slug: 'fussball' }], createdAt: hoursAgo(6) };
    const order = rankForYou([...all, other], profile, { now: NOW });
    expect(order[0]!.id).toBe(6);
  });

  it('pushes quickly skipped topics back', () => {
    const profile = createProfile(NOW);
    for (let i = 0; i < 4; i++) applySignal(profile, sport, 'skip', NOW);
    const score = scoreArticle({ ...sport, id: 9 }, profile, { now: NOW, maxPopularity: 40 });
    expect(score.category).toBeLessThan(0);
    const order = rankForYou([{ ...sport, id: 9 }, politik], profile, { now: NOW });
    expect(order[0]!.id).toBe(1);
  });

  it('recommends similar articles through related, even across categories', () => {
    const profile = createProfile(NOW);
    applySignal(profile, tram, 'read', NOW);
    const withSimilar = scoreArticle(bus, profile, { now: NOW, maxPopularity: 0 });
    const without = scoreArticle(tech, profile, { now: NOW, maxPopularity: 0 });
    expect(withSimilar.similar).toBeGreaterThan(0.5);
    expect(without.similar).toBe(0);
  });

  it('comments and shares count more than a short view', () => {
    const a = applySignal(createProfile(NOW), tech, 'comment', NOW);
    const b = applySignal(createProfile(NOW), tech, 'view', NOW);
    expect(a.categories.Technologie).toBeGreaterThan(b.categories.Technologie!);
  });

  it('moves already opened articles down', () => {
    const profile = createProfile(NOW);
    applySignal(profile, sport, 'open', NOW);
    const order = rankForYou([sport, { ...sport, id: 7, createdAt: hoursAgo(8) }], profile, { now: NOW });
    expect(order[0]!.id).toBe(7);
  });

  it('halves interests after three days', () => {
    const profile = applySignal(createProfile(NOW), sport, 'like', NOW);
    decayProfile(profile, NOW + 3 * 24 * 3_600_000);
    expect(profile.categories.Sport).toBeCloseTo(1.5);
  });

  it('allows up to three articles of one topic in a row, then switches', () => {
    const profile = createProfile(NOW);
    applySignal(profile, politik, 'like', NOW);
    const many = [1, 2, 3, 4, 5].map((id) => ({ id: 10 + id, category: 'Politik', createdAt: hoursAgo(id) }));
    const order = rankForYou([...many, { id: 20, category: 'Kultur', createdAt: hoursAgo(9) }], profile, { now: NOW });
    expect(order.slice(0, 3).every((a) => a.category === 'Politik')).toBe(true);
    expect(order[3]!.id).toBe(20);
  });

  it('after a like the very next card is from the same topic', () => {
    const profile = createProfile(NOW);
    const wirtschaft: RankableArticle = { id: 30, category: 'Wirtschaft', createdAt: hoursAgo(1) };
    const nochWirtschaft: RankableArticle = { id: 31, category: 'Wirtschaft', createdAt: hoursAgo(10) };
    const current = [wirtschaft, politik, sport, tech, nochWirtschaft];
    applySignal(profile, wirtschaft, 'like', NOW);
    const next = rerankTail(current, current, profile, 1, NOW);
    expect(next[0]!.id).toBe(30);
    expect(next[1]!.id).toBe(31);
  });

  it('rerankTail keeps the visible head and reorders the rest', () => {
    const profile = createProfile(NOW);
    const current = [politik, tram, sport, tech, bus];
    // Like auf einen anderen Wirtschaftsartikel: bus rueckt hinter die feste Spitze
    applySignal(profile, { id: 8, category: 'Wirtschaft' }, 'like', NOW);
    applySignal(profile, { id: 8, category: 'Wirtschaft' }, 'comment', NOW);
    const next = rerankTail(current, all, profile, 2, NOW);
    expect(next.slice(0, 2).map((a) => a.id)).toEqual([1, 2]);
    expect(next[2]!.id).toBe(5);
  });

  it('reads the old storage format', () => {
    const profile = parseProfile(null, JSON.stringify({ categories: { Sport: 4 }, tags: { fussball: 2 } }), NOW);
    expect(profile.categories.Sport).toBe(4);
    expect(profile.articles).toEqual({});
  });
});
