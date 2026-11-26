/* Petty — CourtListener docket sweep for household goods ("litigation check").
 * Deterministic parsing; the token (if any) never leaves the device except to CourtListener.
 * Dockets are allegations, not verdicts — render only what the API returns; never invent. */
import { safeGet } from './safeStorage';

export interface DocketHit {
  caseName: string;
  court: string;
  dateFiled: string;
  docketNumber: string;
  pageUrl: string;
}

export const clToken = (): string => safeGet('petty-cl-token') ?? '';
export const docketDeepLink = (query: string): string =>
  `https://www.courtlistener.com/?q=${encodeURIComponent(query.trim())}&type=d`;

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const pickStr = (r: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) { const v = r[k]; if (typeof v === 'string' && v) return v; }
  return '';
};

export function parseDocketResults(raw: unknown, limit = 5): DocketHit[] {
  const listRaw = isRec(raw) && Array.isArray(raw['results']) ? raw['results'] : [];
  const hits: DocketHit[] = [];
  for (const item of listRaw) {
    if (!isRec(item)) continue;
    const absolute = pickStr(item, ['absolute_url']);
    hits.push({
      caseName: pickStr(item, ['caseName', 'case_name']) || 'Untitled docket',
      court: pickStr(item, ['court']),
      dateFiled: pickStr(item, ['dateFiled', 'date_filed', 'dateArgued', 'date_argued']),
      docketNumber: pickStr(item, ['docketNumber', 'docket_number']),
      pageUrl: absolute ? `https://www.courtlistener.com${absolute}` : docketDeepLink(pickStr(item, ['caseName', 'case_name']) || 'docket'),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

/* Called only from a user gesture. Returns null on auth/network failure — UI renders the honest state. */
export async function fetchDockets(query: string, token: string, limit = 5): Promise<DocketHit[]> {
  const res = await fetch(`https://www.courtlistener.com/api/rest/v4/search/?q=${encodeURIComponent(query.trim())}&type=d`, {
    headers: { Authorization: `Token ${token.trim()}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error('auth');
  if (!res.ok) throw new Error(String(res.status));
  const raw: unknown = await res.json();
  return parseDocketResults(raw, limit);
}
