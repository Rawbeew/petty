/* Petty — LIVE open-government feeds (keyless, CORS-verified 2026-11-26).
 * openFDA enforcement · NWS active alerts · NYPD collisions (Socrata) · data.police.uk street crime.
 * No demo fallback exists: on failure the caller renders an explicit source-unavailable state.
 * All parsing goes through unknown + runtime validators — no blind casts. */
import type { SafetySignal } from '../data/signals';

const TIMEOUT_MS = 7000;

async function fetchJSON(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => { ctrl.abort(); }, TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as unknown;
  } finally { clearTimeout(t); }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/* deterministic national-centroid jitter for notices that carry no coordinates */
const jitter = (seed: string, span: number): number => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * span;
};

const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const oneline = (s: string) => s.replace(/\s+/g, ' ').trim();

/* ---------- openFDA enforcement (food, drug, device) ---------- */
export interface FDAEnforcementHit {
  recallNumber: string; classification: string; firm: string; product: string;
  reason: string; reportDate: string; sourceUrl: string;
  severity: SafetySignal['severity']; body: 'food' | 'drug' | 'device';
}
const sevFromClass = (c: string): SafetySignal['severity'] =>
  c.includes('I') && !c.includes('II') ? 'critical' : c.includes('II') && !c.includes('III') ? 'high' : 'moderate';
const fdaSource = 'https://www.accessdata.fda.gov/scripts/ires/index.cfm';

export async function fetchOpenFDARecalls(query: string, limit = 6): Promise<FDAEnforcementHit[]> {
  const q = encodeURIComponent(`product_description:"${query.replace(/["\\]/g, ' ')}"`);
  const bodies = ['food', 'drug', 'device'] as const;
  const settled = await Promise.allSettled(bodies.map(async b => {
    const u = `https://api.fda.gov/${b}/enforcement.json?search=${q}&sort=report_date:desc&limit=${limit}`;
    const data = await fetchJSON(u);
    if (!isRecord(data)) return [];
    return arr(data['results']).filter(isRecord).map(r => {
      const cls = oneline(str(r['classification'], 'Class III'));
      return {
        recallNumber: str(r['recall_number'], ''),
        classification: cls,
        firm: oneline(str(r['recalling_firm'], 'Unknown firm')),
        product: oneline(str(r['product_description'], 'Product not stated')),
        reason: oneline(str(r['reason_for_recall'], 'Reason not stated')),
        reportDate: str(r['report_date'], ''),
        sourceUrl: fdaSource,
        severity: sevFromClass(cls),
        body: b,
      } satisfies FDAEnforcementHit;
    });
  }));
  return settled.flatMap(s => (s.status === 'fulfilled' ? s.value : []));
}

export async function fetchOpenFDA(limit = 6): Promise<SafetySignal[]> {
  const url = `https://api.fda.gov/food/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=${limit}`;
  const data = await fetchJSON(url);
  if (!isRecord(data)) return [];
  return arr(data['results']).filter(isRecord).map((r, i) => {
    const cls = oneline(str(r['classification'], 'Class III'));
    const d = str(r['report_date']);
    const publishedAt = /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00Z` : new Date().toISOString();
    const firm = oneline(str(r['recalling_firm'], 'Unknown firm'));
    const product = trunc(oneline(str(r['product_description'], 'Product not stated')), 180);
    const reason = oneline(str(r['reason_for_recall'], 'Reason not stated'));
    return {
      id: `live-fda-${str(r['recall_number'], String(i))}`,
      pillar: 'health',
      title: trunc(`${cls} recall — ${firm}`, 110),
      agency: 'US FDA (openFDA)',
      country: 'US',
      severity: sevFromClass(cls),
      confidence: 'verified_agency',
      lat: 39.1 + jitter(`fda${i}${firm}`, 14),
      lng: -98.6 + jitter(`fda${i}${reason}`, 22),
      publishedAt,
      summary: `Agency reported recall (${cls}): ${product}`,
      rawOfficialText: `Firm: ${firm}. Product: ${product}. Reason: ${reason}. Classification: ${cls}${str(r['recall_number']) ? ` · Recall #${str(r['recall_number'])}` : ''}. [National notice — coordinates not published; plotted at national centroid.]`,
      sourceUrl: fdaSource,
      tags: ['openfda', 'recall', cls.toLowerCase().replace(' ', '-'), 'live'],
    };
  });
}

/* ---------- NWS active alerts ---------- */
export async function fetchNWSAlerts(limit = 6): Promise<SafetySignal[]> {
  const data = await fetchJSON('https://api.weather.gov/alerts/active?status=actual&message_type=alert');
  if (!isRecord(data)) return [];
  return arr(data['features']).filter(isRecord).slice(0, limit).map((f, i) => {
    const p = isRecord(f['properties']) ? f['properties'] : {};
    const event = str(p['event'], 'Alert');
    const area = oneline(str(p['areaDesc']));
    const severity = str(p['severity']);
    const sev = severity === 'Extreme' ? 'critical' : severity === 'Severe' ? 'high' : severity === 'Moderate' ? 'moderate' : 'watch';
    const headline = oneline(str(p['headline'], event));
    const instruction = str(p['instruction']);
    const ends = str(p['ends']);
    return {
      id: `live-nws-${i}-${str(p['sent']).slice(0, 16)}`,
      pillar: 'weather',
      title: trunc(`${event} — ${area.split(';')[0]?.trim() ?? ''}`, 120),
      agency: oneline(str(p['senderName'], 'US NWS')),
      country: 'US',
      severity: sev,
      confidence: 'verified_agency',
      lat: 39.1 + jitter(`nws${i}${headline}`, 12),
      lng: -98.6 + jitter(`nws${i}${area}`, 20),
      publishedAt: str(p['sent'], new Date().toISOString()),
      summary: `Agency reported — ${headline}`,
      rawOfficialText: `${headline}${instruction ? ` Instruction: ${instruction}` : ''}${ends ? ` Ends: ${ends}` : ''} [Polygon not published in this payload; plotted at national centroid. Verify area at source.]`,
      sourceUrl: str(p['@id'], 'https://alerts.weather.gov'),
      tags: ['nws', 'cap', 'live'],
    };
  });
}

/* ---------- NYPD collisions (Socrata) — Field Wire only ---------- */
export interface NYPDCollision { date: string; borough: string; injured: number; killed: number; factor: string; id: string; }
export async function fetchNYPDCollisions(days = 7, limit = 60): Promise<{ total: number; injured: number; killed: number; rows: NYPDCollision[] }> {
  const base = 'https://data.cityofnewyork.us/resource/h9gi-nx95.json';
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const where = encodeURIComponent(`crash_date >= '${since}T00:00:00'`);
  const [cnt, sum, rows] = await Promise.all([
    fetchJSON(`${base}?$select=count(*)&$where=${where}`),
    fetchJSON(`${base}?$select=sum(number_of_persons_injured)%20as%20sum_i,sum(number_of_persons_killed)%20as%20sum_k&$where=${where}`),
    fetchJSON(`${base}?$select=crash_date,borough,number_of_persons_injured,number_of_persons_killed,contributing_factor_vehicle_1,collision_id&$where=${where}&$order=crash_date%20DESC&$limit=${limit}`),
  ]);
  const cntFirst = arr(cnt)[0];
  const cnt0 = isRecord(cntFirst) ? cntFirst : {};
  const sumFirst = arr(sum)[0];
  const sum0 = isRecord(sumFirst) ? sumFirst : {};
  return {
    total: num(cnt0['count']),
    injured: Math.round(num(sum0['sum_i'])),
    killed: Math.round(num(sum0['sum_k'])),
    rows: arr(rows).filter(isRecord).map(r => ({
      date: str(r['crash_date']).slice(0, 10),
      borough: str(r['borough'], 'Unknown'),
      injured: num(r['number_of_persons_injured']),
      killed: num(r['number_of_persons_killed']),
      factor: str(r['contributing_factor_vehicle_1'], '—'),
      id: str(r['collision_id']),
    })),
  };
}

/* ---------- UK street-level crime (police.uk) — aggregate, OGL v3.0 ---------- */
export interface UKTown { name: string; lat: number; lng: number }
export const UK_TOWNS: readonly [UKTown, ...UKTown[]] = [
  { name: 'London — Trafalgar Sq', lat: 51.508, lng: -0.128 },
  { name: 'Manchester — St Peter’s Sq', lat: 53.4785, lng: -2.244 },
  { name: 'Edinburgh — Princes St', lat: 55.9519, lng: -3.1965 },
  { name: 'Birmingham — Centenary Sq', lat: 52.4814, lng: -1.9146 },
];
export interface UKCrimeFeed { month: string; total: number; byCategory: { category: string; count: number }[] }
export async function fetchUKCrime(lat: number, lng: number): Promise<UKCrimeFeed | null> {
  const d = new Date(); d.setMonth(d.getMonth() - 2);
  const month = d.toISOString().slice(0, 7);
  const data = await fetchJSON(`https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${month}`);
  const rows = arr(data).filter(isRecord);
  if (rows.length === 0) return null;
  const counts = new Map<string, number>();
  for (const r of rows) { const c = str(r['category'], 'unknown'); counts.set(c, (counts.get(c) ?? 0) + 1); }
  return { month, total: rows.length, byCategory: [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count) };
}

/* ---------- UK FSA food alerts (OGL v3, data.food.gov.uk) — GB health ---------- */
export interface FSAFoodAlert {
  notation: string; created: string; title: string; riskStatement: string;
  business: string; alertType: 'AA' | 'PRIN' | 'FAFA' | 'OTHER'; url: string;
}
const fsaType = (t: unknown): FSAFoodAlert['alertType'] => {
  const s = JSON.stringify(t);
  if (s.includes('/FAFA')) return 'FAFA';
  if (s.includes('/AA')) return 'AA';
  if (s.includes('/PRIN')) return 'PRIN';
  return 'OTHER';
};
export const fsaSeverity = (t: FSAFoodAlert['alertType']): SafetySignal['severity'] =>
  t === 'FAFA' ? 'critical' : t === 'AA' ? 'high' : t === 'PRIN' ? 'moderate' : 'watch';

const parseFSAItem = (item: Record<string, unknown>): FSAFoodAlert => {
  const problem = arr(item['problem']).find(isRecord);
  const biz = isRecord(item['reportingBusiness']) ? item['reportingBusiness'] : {};
  return {
    notation: str(item['notation']),
    created: str(item['created']),
    title: oneline(str(item['shortTitle']) || str(item['title'], 'FSA food alert')),
    riskStatement: problem ? oneline(str(problem['riskStatement'])) : '',
    business: oneline(str(biz['commonName'])),
    alertType: fsaType(item['type']),
    url: str(item['alertURL'], 'https://data.food.gov.uk/food-alerts'),
  };
};

export async function fetchFSAFoodAlerts(limit = 6, search?: string): Promise<FSAFoodAlert[]> {
  /* The API's server-side `search=` parameter silently returns [] (verified 2026-11-26) —
   * fetch the latest 60 and substring-filter client-side instead. */
  const want = search ? 60 : limit;
  const data = await fetchJSON(`https://data.food.gov.uk/food-alerts/id.json?_limit=${want}&_sort=-created`);
  if (!isRecord(data)) return [];
  const q = search?.trim().toLowerCase();
  const out: FSAFoodAlert[] = [];
  for (const item of arr(data['items']).filter(isRecord)) {
    const a = parseFSAItem(item);
    if (q) {
      const hay = `${a.title} ${a.riskStatement} ${a.business} ${a.notation}`.toLowerCase();
      if (!q.split(/\s+/).every(w => hay.includes(w))) continue;
    }
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

export async function fetchFSAAsSignals(limit = 5): Promise<SafetySignal[]> {
  const alerts = await fetchFSAFoodAlerts(limit);
  return alerts.map((a, i) => ({
    id: `live-fsa-${a.notation || i}`,
    pillar: 'health' as const,
    title: trunc(a.title, 110),
    agency: 'UK FSA (food.gov.uk)',
    country: 'GB',
    severity: fsaSeverity(a.alertType),
    confidence: 'verified_agency' as const,
    lat: 54.5 + jitter(`fsa${i}${a.notation}`, 4.5),
    lng: -2.4 + jitter(`fsa${i}${a.title}`, 6),
    publishedAt: a.created ? `${a.created}T12:00:00Z` : new Date().toISOString(),
    summary: `Agency reported — ${a.title}`,
    rawOfficialText: `${a.title}.${a.riskStatement ? ` ${a.riskStatement}` : ''}${a.business ? ` Firm: ${a.business}.` : ''} Notation: ${a.notation} [UK notice — no coordinates published; plotted at national centroid.]`,
    sourceUrl: a.url,
    tags: ['fsa', 'food-alert', a.alertType.toLowerCase(), 'live'],
  }));
}

/* ---------- CPSC recalls (US consumer products, saferproducts.gov) — US health ---------- */
export async function fetchCPSCRecalls(days = 45, limit = 4): Promise<SafetySignal[]> {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const data = await fetchJSON(`https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${start}&RecallDateEnd=${end}`);
  if (!Array.isArray(data)) return [];
  return [...data.filter(isRecord)]
    .sort((a, b) => str(b['RecallDate']).localeCompare(str(a['RecallDate'])))
    .slice(0, limit)
    .map((r, i) => {
      const title = oneline(str(r['Title'], 'CPSC recall'));
      const hazards = arr(r['Hazards']).filter(isRecord);
      const hazard = hazards.length ? oneline(str(hazards[0]?.['Name'])) : '';
      const products = arr(r['Products']).filter(isRecord).map(p => oneline(str(p['Name']))).filter(Boolean);
      const d = str(r['RecallDate']);
      return {
        id: `live-cpsc-${str(r['RecallID'], String(i))}`,
        pillar: 'health' as const,
        title: trunc(title, 110),
        agency: 'US CPSC (saferproducts.gov)',
        country: 'US',
        severity: 'moderate' as const, /* CPSC publishes no hazard class — pinned to moderate, never guessed up */
        confidence: 'verified_agency' as const,
        lat: 39.1 + jitter(`cpsc${i}${title}`, 14),
        lng: -98.6 + jitter(`cpsc${i}${str(r['RecallNumber'])}`, 22),
        publishedAt: /^\d{4}-\d{2}-\d{2}/.test(d) ? `${d.slice(0, 10)}T12:00:00Z` : new Date().toISOString(),
        summary: `Agency reported recall — ${products[0] ?? title}`,
        rawOfficialText: `${title}.${hazard ? ` Hazard: ${hazard}` : ''}${products.length ? ` Products: ${products.join('; ')}.` : ''} Recall #${str(r['RecallNumber'])}. [National notice — no coordinates published; plotted at national centroid.]`,
        sourceUrl: str(r['URL'], 'https://www.cpsc.gov/Recalls'),
        tags: ['cpsc', 'recall', 'consumer-product', 'live'],
      };
    });
}

/* ---------- ECCC MSC GeoMet weather alerts (OGC API Features) — CA weather ---------- */
export async function fetchECCCWeatherAlerts(limit = 6): Promise<SafetySignal[]> {
  const data = await fetchJSON('https://api.weather.gc.ca/collections/weather-alerts/items?limit=100&f=json');
  if (!isRecord(data)) return [];
  const active = arr(data['features']).filter(isRecord)
    .filter(f => { const p = isRecord(f['properties']) ? f['properties'] : {}; return str(p['status_en']) === 'issued' || str(p['status_en']) === 'continued'; })
    .sort((a, b) => {
      const pa = isRecord(a['properties']) ? str(a['properties']['publication_datetime']) : '';
      const pb = isRecord(b['properties']) ? str(b['properties']['publication_datetime']) : '';
      return pb.localeCompare(pa);
    })
    .slice(0, limit);
  return active.map((f, i) => {
    const p = isRecord(f['properties']) ? f['properties'] : {};
    const type = str(p['alert_type'], 'statement');
    const name = oneline(str(p['alert_name_en'], 'weather alert'));
    const area = oneline(str(p['feature_name_en'], 'Canada'));
    const prov = str(p['province']);
    const sev: SafetySignal['severity'] = type === 'warning' ? 'high' : type === 'watch' ? 'moderate' : 'watch';
    const text = oneline(str(p['alert_text_en']));
    return {
      id: `live-eccc-${str(f['id'], String(i))}`,
      pillar: 'weather' as const,
      title: trunc(`${name[0]?.toUpperCase() ?? ''}${name.slice(1)} — ${area}${prov ? ` (${prov})` : ''}`, 110),
      agency: 'ECCC — MSC GeoMet',
      country: 'CA',
      severity: sev,
      confidence: 'verified_agency' as const,
      lat: 56 + jitter(`eccc${i}${area}`, 14),
      lng: -96 + jitter(`eccc${i}${name}`, 30),
      publishedAt: str(p['publication_datetime'], new Date().toISOString()),
      summary: `Agency reported — ${name} for ${area}`,
      rawOfficialText: `${text} [Polygon published in GeoJSON; not rendered here — verify area + status at source.]`,
      sourceUrl: 'https://weather.gc.ca/warnings/index_e.html',
      tags: ['eccc', 'geomet', 'weather', type, 'live'],
    };
  });
}

/* ---------- text fetch (RSS/Atom) ---------- */
async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => { ctrl.abort(); }, TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(t); }
}
const stripTags = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const firstText = (parent: Element, name: string): string => parent.getElementsByTagName(name)[0]?.textContent?.trim() ?? '';

/* ---------- WHO news (English) RSS — GL health desk ---------- */
export async function fetchWHONews(limit = 4): Promise<SafetySignal[]> {
  const xml = await fetchText('https://www.who.int/rss-feeds/news-english.xml');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return [];
  // WHO feed is oldest-first & corporate — only items from the last 90 days may surface,
  // otherwise an honest global wire would show 2020 press releases as "live".
  const freshnessCutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const items = [...doc.getElementsByTagName('item')]
    .map(el => ({ el, d: Date.parse(firstText(el, 'pubDate')) }))
    .filter(x => Number.isFinite(x.d) && x.d >= freshnessCutoff)
    .sort((a, b) => b.d - a.d)
    .slice(0, limit)
    .map(x => x.el);
  return items.flatMap((el, i) => {
    const title = firstText(el, 'title');
    const link = firstText(el, 'link');
    if (!title || !link) return [];
    const desc = stripTags(firstText(el, 'description'));
    const d = Date.parse(firstText(el, 'pubDate'));
    return [{
      id: `live-who-${i}-${title.slice(0, 24)}`,
      pillar: 'health' as const,
      title: trunc(title, 110),
      agency: 'WHO — News (English)',
      country: 'GL',
      severity: 'watch' as const,
      confidence: 'verified_agency' as const,
      lat: 46.2 + jitter(`who${i}${title}`, 30),
      lng: 6.1 + jitter(`who${i}${link}`, 60),
      publishedAt: Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString(),
      summary: `WHO reported — ${trunc(title, 140)}`,
      rawOfficialText: `${title}. ${trunc(desc, 420)} [WHO news item — global; follow the link for the authoritative version.]`,
      sourceUrl: link,
      tags: ['who', 'news', 'global-health', 'live'],
    }];
  });
}

/* ---------- Find Case Law (The National Archives, Open Justice Licence) — GB courts ---------- */
export async function fetchFindCaseLaw(limit = 5): Promise<SafetySignal[]> {
  const xml = await fetchText('https://caselaw.nationalarchives.gov.uk/atom.xml');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return [];
  const nsAll = (parent: Element, local: string) => [...parent.getElementsByTagNameNS('*', local)];
  const entries = nsAll(doc.documentElement, 'entry').slice(0, limit);
  return entries.flatMap((el, i) => {
    const title = nsAll(el, 'title')[0]?.textContent?.trim() ?? '';
    const court = nsAll(el, 'name')[0]?.textContent?.trim() ?? '';
    const upd = nsAll(el, 'updated')[0]?.textContent?.trim() ?? nsAll(el, 'published')[0]?.textContent?.trim() ?? '';
    const citation = nsAll(el, 'identifier').find(x => x.getAttribute('type') === 'ukncn')?.textContent?.trim() ?? '';
    const link = nsAll(el, 'link').find(x => x.getAttribute('rel') === 'alternate' && x.getAttribute('type') === null)?.getAttribute('href')
      ?? nsAll(el, 'link').find(x => x.getAttribute('rel') === 'alternate')?.getAttribute('href') ?? 'https://caselaw.nationalarchives.gov.uk';
    if (!title) return [];
    const d = Date.parse(upd);
    return [{
      id: `live-fcl-${i}-${title.slice(0, 24)}`,
      pillar: 'courts' as const,
      title: trunc(title, 110),
      agency: `The National Archives — ${court || 'Find Case Law'}`,
      country: 'GB',
      severity: 'watch' as const,
      confidence: 'verified_agency' as const,
      lat: 51.5 + jitter(`fcl${i}${title}`, 2.5),
      lng: -0.12 + jitter(`fcl${i}${citation}`, 3.5),
      publishedAt: Number.isNaN(d) ? new Date().toISOString() : new Date(d).toISOString(),
      summary: `Judgment published — ${trunc(title, 140)}`,
      rawOfficialText: `${title}. Court: ${court}.${citation ? ` Citation: ${citation}.` : ''} Published: ${Number.isNaN(d) ? upd : new Date(d).toISOString().slice(0, 10)}. [Judgment — verbatim fields; read the judgment at source before relying on it.]`,
      sourceUrl: link,
      tags: ['findcaselaw', 'courts', 'ojl', 'live'],
    }];
  });
}

/* ---------- data.police.uk stops-and-search (OGL v3) — Field Wire ---------- */
export interface UKStopFeed { month: string; total: number; top: { label: string; count: number }[] }
export async function fetchUKStops(lat: number, lng: number): Promise<UKStopFeed | null> {
  const d = new Date(); d.setMonth(d.getMonth() - 2);
  const month = d.toISOString().slice(0, 7);
  const data = await fetchJSON(`https://data.police.uk/api/stops-street?date=${month}&lat=${lat}&lng=${lng}`);
  const rows = arr(data).filter(isRecord);
  if (rows.length === 0) return null;
  const counts = new Map<string, number>();
  for (const r of rows) { const c = oneline(str(r['object_of_search'], 'not recorded')); counts.set(c, (counts.get(c) ?? 0) + 1); }
  return { month, total: rows.length, top: [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 4) };
}
