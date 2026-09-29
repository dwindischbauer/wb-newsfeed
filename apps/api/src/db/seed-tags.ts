import { db } from './index';
import { tags } from './schema';
import { eq } from 'drizzle-orm';
import { CATEGORY_SUBTAGS } from '../utils/metadata';

// Tags sind genau die Unterkategorien aus utils/metadata.ts
const INITIAL_TAGS = Object.values(CATEGORY_SUBTAGS).flat().map(({ name, slug, color }) => ({ name, slug, color }));

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
