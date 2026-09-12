import { db } from './index';
import { tags } from './schema';
import { eq } from 'drizzle-orm';

const INITIAL_TAGS = [
  { name: 'Innenpolitik', slug: 'innenpolitik', color: '#dc2626' },
  { name: 'Außenpolitik', slug: 'aussenpolitik', color: '#2563eb' },
  { name: 'Wirtschaftspolitik', slug: 'wirtschaftspolitik', color: '#059669' },
  { name: 'Finanzen', slug: 'finanzen', color: '#10b981' },
  { name: 'Digital & KI', slug: 'digital-ki', color: '#6366f1' },
  { name: 'Technologie', slug: 'technologie', color: '#8b5cf6' },
  { name: 'Klima & Energie', slug: 'klima-energie', color: '#14b8a6' },
  { name: 'Fußball', slug: 'fussball', color: '#f59e0b' },
  { name: 'Wintersport', slug: 'wintersport', color: '#0284c7' },
  { name: 'Kultur & Kunst', slug: 'kultur-kunst', color: '#d946ef' },
  { name: 'Chronik', slug: 'chronik', color: '#64748b' }
];

export async function seedTags() {
  for (const tag of INITIAL_TAGS) {
    try {
      const existing = await db.select().from(tags).where(eq(tags.slug, tag.slug));
      if (existing.length === 0) {
        await db.insert(tags).values(tag);
      }
    } catch (e) {
      // ignore
    }
  }
}

if (require.main === module || process.argv[1]?.includes('seed-tags')) {
  seedTags().then(() => {
    console.log('Default tags seeded');
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
