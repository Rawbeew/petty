/* Server-ingested recall portal cache (public/recall-cache.json).
 * Loaded SAME-ORIGIN at runtime by the Guard view. Absent file → null → UI shows
 * nothing about scraped portals (never placeholders). Present file → every entry
 * renders with its provenance: source URL, fetch time, ok/unreachable status. */

export interface RecallCacheEntry {
  id: string; market: string; name: string; url: string;
  fetched_at: string | null; status: 'ok' | 'unreachable'; markdown: string | null; error: string | null;
}
export interface RecallCache {
  schema: string; generated_at: string; engine: string; entries: RecallCacheEntry[];
}

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const isEntry = (e: unknown): e is RecallCacheEntry => {
  if (!isRecord(e)) return false;
  return typeof e['id'] === 'string' && typeof e['market'] === 'string' && typeof e['name'] === 'string'
    && typeof e['url'] === 'string' && (e['status'] === 'ok' || e['status'] === 'unreachable');
};

export async function loadRecallCache(): Promise<RecallCache | null> {
  try {
    const res = await fetch('recall-cache.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const j: unknown = await res.json();
    if (!isRecord(j)) return null;
    if (j['schema'] !== 'petty.recall-cache/v1' || !Array.isArray(j['entries'])) return null;
    const entries = j['entries'].filter(isEntry);
    return { schema: 'petty.recall-cache/v1', generated_at: str(j['generated_at']),
             engine: str(j['engine']), entries };
  } catch { return null; }
}
