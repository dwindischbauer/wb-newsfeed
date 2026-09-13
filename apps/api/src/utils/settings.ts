import { db } from '../db';
import { settings } from '../db/schema';

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const all = await db.select().from(settings);
    return all.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (err) {
    return {};
  }
}
