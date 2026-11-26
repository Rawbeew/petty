import { useState } from 'react';
import { ScanLine, Gavel, FlaskConical, CheckCircle2, CircleAlert, ExternalLink, FileSearch, AudioLines, Clapperboard, Radio, Sparkles, CircleSlash, Milk, Package } from 'lucide-react';
import type { CountryPack } from '../data/packs';
import { COUNTRY_PACKS } from '../data/packs';
import { SectionHeader } from './ui/SectionHeader';
import { cx } from '../lib/ui';
import { useEffect } from 'react';
import { fetchOpenFDARecalls, fetchFSAFoodAlerts, fetchFindCaseLaw, type FDAEnforcementHit, type FSAFoodAlert } from '../lib/live';
import { loadRecallCache, type RecallCache } from '../lib/recallCache';
import FieldWire from './FieldWire';
import { PopVerdict } from './ui/Motion';
import ClipStudio from './ClipStudio';
import FoodFraudCard from './FoodFraudCard';
import PantryLedger from './PantryLedger';

const SAMPLES = ['peanut butter', 'losartan', 'infusion pump', 'e-bike battery', 'sunscreen'];

const sevRank = { critical: 0, high: 1, moderate: 2, watch: 3 } as const;
const verdictFor = (hit: FDAEnforcementHit): { label: string; cls: string } =>
  hit.classification.startsWith('Class I') ? { label: 'CLASS I — STOP USE', cls: 'chip-red' }
  : hit.classification.startsWith('Class II') ? { label: 'CLASS II — CHECK LOT', cls: 'chip-gold' }
  : { label: 'CLASS III — MONITOR', cls: 'chip-cyan' };

function FSAHitCard({ h }: { h: FSAFoodAlert }) {
  const style = h.alertType === 'FAFA' ? { label: 'FAFA — URGENT ACTION', cls: 'chip-red' }
    : h.alertType === 'AA' ? { label: 'ALLERGY ALERT', cls: 'chip-gold' }
    : h.alertType === 'PRIN' ? { label: 'PRODUCT RECALL', cls: 'chip-cyan' }
    : { label: 'FSA NOTICE', cls: 'chip-cyan' };
  return (
    <li className="rounded-xl border border-[var(--line2)] p-3.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={cx('chip', style.cls)}>{h.alertType === 'FAFA' ? <CircleAlert size={11} /> : <CheckCircle2 size={11} />}{style.label}</span>
        <span className="mono text-[8px] text-[var(--dim)]">UK FSA · {h.created}</span>
      </div>
      <p className="mono text-[10px] text-[var(--ink)] mt-2 leading-relaxed">{h.title}</p>
      <p className="text-[11px] text-[#c9cddb] mt-1.5 leading-snug"><span className="text-[var(--dim)]">{h.business || 'FSA'} — </span>{h.riskStatement || 'No risk statement published.'}</p>
      <a href={h.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[9px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={10} />Alert {h.notation} (FSA)</a>
    </li>
  );
}

function Scanner({ pack, seed }: { pack: CountryPack; seed?: string | undefined }) {
  const [input, setInput] = useState(seed ?? '');
  const [result, setResult] = useState<{ query: string; fda: FDAEnforcementHit[] | null; fsa: FSAFoodAlert[] | null; fdaError: boolean; fsaError: boolean } | null>(null);
  const [scanning, setScanning] = useState(false);
  const healthPortals = COUNTRY_PACKS.filter(p => p.code === pack.code || p.code === 'GL').flatMap(p => p.regulators.filter(r => r.pillar === 'health').slice(0, 2));
  const showFda = pack.code === 'US' || pack.code === 'GL';
  const showFsa = pack.code === 'GB' || pack.code === 'GL';
  const anySource = showFda || showFsa;

  const scan = async (q: string) => {
    const query = q.trim();
    if (!query || !anySource) return;
    setScanning(true); setResult(null);
    const [fd, fs] = await Promise.allSettled([
      showFda ? fetchOpenFDARecalls(query, 5) : Promise.resolve<FDAEnforcementHit[] | null>(null),
      showFsa ? fetchFSAFoodAlerts(5, query) : Promise.resolve<FSAFoodAlert[] | null>(null),
    ]);
    if (fd.status === 'fulfilled') fd.value?.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
    setResult({
      query,
      fda: fd.status === 'fulfilled' ? fd.value : null,
      fsa: fs.status === 'fulfilled' ? fs.value : null,
      fdaError: showFda && fd.status === 'rejected',
      fsaError: showFsa && fs.status === 'rejected',
    });
    setScanning(false);
  };

  if (!anySource) {
    return (
      <div className="panel p-5 space-y-3">
        <SectionHeader icon={FlaskConical} kicker="Recall scanner" title="No machine-readable recall feed for this market." />
        <p className="text-[12px] text-[var(--dim)] leading-relaxed">Canada (recalls-rappels.canada.ca) and Australia (TGA) publish no keyless, CORS-open recall API we can query from a browser — the CFIA site is page-only, and TGA could not be reached from this build network on 2026-11-26. Petty does not simulate results. Verify at the official portals:</p>
        <ul className="space-y-1.5">{healthPortals.map((r, i) => <li key={i}><a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={11} />{r.name}</a></li>)}</ul>
      </div>
    );
  }

  const fdaList = result?.fda ?? [];
  const fsaList = result?.fsa ?? [];
  const fdaCount = fdaList.length;
  const fsaCount = fsaList.length;
  const emptyResult = result !== null && fdaCount === 0 && fsaCount === 0 && !result.fdaError && !result.fsaError ? result : null;

  return (
    <div className="grid lg:grid-cols-[1.05fr_1fr] gap-4">
      {/* input side */}
      <section className="panel p-5 space-y-4">
        <SectionHeader icon={FlaskConical} kicker="Recall scanner — LIVE" title="Pantry, pill bottle, device." />
        <p className="text-[12px] text-[var(--dim)] leading-relaxed -mt-2">Queries the <strong>live openFDA enforcement database</strong> (food · drug · device) and the <strong>UK FSA Food Alerts API</strong> (OGL v3){showFda && showFsa ? ' — both' : showFsa ? ' — FSA only' : ' — openFDA only'}. Verbatim fields, every result links to the agency notice. Not a medical diagnosis — recalls, not advice.</p>
        <form onSubmit={e => { e.preventDefault(); void scan(input); }}>
          <label className="lbl" htmlFor="scan">Product / drug / ingredient / allergen</label>
          <input id="scan" autoFocus value={input} onChange={e => { setInput(e.target.value); setResult(null); }} placeholder="e.g. peanut butter, losartan, infusion pump…" className="field" aria-label="Product to scan" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="mono text-[9px] text-[var(--dim)] self-center mr-1">TRY:</span>
            {SAMPLES.map(s => <button key={s} type="button" onClick={() => { setInput(s); void scan(s); }} className="chip hover:chip-gold transition-colors">{s}</button>)}
          </div>
          <button type="submit" disabled={scanning} className="mt-3 w-full rounded-xl bg-[var(--gold)] disabled:opacity-60 text-black font-bold py-3 mono text-xs tracking-[0.2em] uppercase hover:bg-[var(--gold2)] transition-colors flex items-center justify-center gap-2"><Sparkles size={14} aria-hidden />{scanning ? 'QUERYING SOURCES…' : 'Scan enforcement databases'}</button>
        </form>
        <p className="mono text-[8px] text-[var(--dim)]">openFDA: field-limited search (product_description), sort report_date desc · FSA: latest 60 alerts, client-side filter (their server-side search silently returns 0 — verified 2026-11-26) · openFDA disclaimer: data is unvalidated — confirm at the linked recall file before acting.</p>
      </section>

      {/* results side — announced politely to assistive tech */}
      <section className="panel-flat p-5 max-h-[620px] overflow-y-auto" aria-live="polite" aria-busy={scanning} aria-label="Enforcement matches">
        <div className="flex items-center justify-between mb-3">
          <span className="mono text-[10px] tracking-[0.25em] text-[var(--dim)]">ENFORCEMENT MATCHES</span>
          {result !== null && <span className="mono text-[9px] text-[var(--dim)]">{fdaCount + fsaCount} RESULT{fdaCount + fsaCount === 1 ? '' : 'S'}</span>}
        </div>
        {result?.fdaError === true && (
          <div className="rounded-xl border border-[rgba(255,90,90,0.35)] p-3 mb-3">
            <span className="chip chip-red"><CircleSlash size={11} />openFDA UNREACHABLE</span>
            <p className="text-[11px] mt-1.5 text-[#d8d5c9]">Live query failed — network or openFDA rate limit. No openFDA results are shown rather than guessed.</p>
          </div>
        )}
        {result?.fsaError === true && (
          <div className="rounded-xl border border-[rgba(255,90,90,0.35)] p-3 mb-3">
            <span className="chip chip-red"><CircleSlash size={11} />FSA UNREACHABLE</span>
            <p className="text-[11px] mt-1.5 text-[#d8d5c9]">UK FSA query failed — network or API change. No FSA results are shown rather than guessed.</p>
          </div>
        )}
        {result === null && !scanning && (
          <div className="h-56 flex flex-col items-center justify-center text-center gap-3 text-[var(--dim)]">
            <ScanLine size={38} strokeWidth={1.2} className="opacity-50" />
            <p className="text-[12px]">Enter a term. Every answer comes from the agencies — or not at all.</p>
          </div>
        )}
        {emptyResult !== null && (
          <div className="rounded-xl border border-[rgba(61,220,151,0.3)] bg-[rgba(61,220,151,0.05)] p-4">
            <span className="chip chip-green"><CheckCircle2 size={11} />NO MATCHING ENFORCEMENT</span>
            <p className="text-[12px] leading-relaxed mt-2 text-[#c9d8cd]">Neither source has a notice matching “{emptyResult.query}”. Absence here is not proof of safety — cross-check the portals for {pack.name}:</p>
            <ul className="mt-2 space-y-1.5">{healthPortals.map((r, i) => <li key={i}><a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={11} />{r.name}</a></li>)}</ul>
          </div>
        )}
        {fdaCount > 0 && (
          <PopVerdict className="mb-0">
            <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)] mt-1 mb-1.5">US FDA — ENFORCEMENT ({fdaCount})</div>
            <ul className="space-y-2.5 mb-4">
              {fdaList.map(h => {
                const v = verdictFor(h);
                const d = h.reportDate.length === 8 ? `${h.reportDate.slice(0, 4)}-${h.reportDate.slice(4, 6)}-${h.reportDate.slice(6, 8)}` : h.reportDate;
                return (
                  <li key={`${h.body}-${h.recallNumber}-${h.firm}`} className="rounded-xl border border-[var(--line2)] p-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={cx('chip', v.cls)}>{h.classification.startsWith('Class I') ? <CircleAlert size={11} /> : <CheckCircle2 size={11} />}{v.label}</span>
                      <span className="mono text-[8px] text-[var(--dim)]">{h.body.toUpperCase()} · {d}</span>
                    </div>
                    <p className="mono text-[10px] text-[var(--ink)] mt-2 leading-relaxed">{h.product}</p>
                    <p className="text-[11px] text-[#c9cddb] mt-1.5 leading-snug"><span className="text-[var(--dim)]">{h.firm} — </span>{h.reason}</p>
                    <a href={h.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[9px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={10} />Recall file{h.recallNumber ? ` #${h.recallNumber}` : ''} (FDA openFDA)</a>
                  </li>
                );
              })}
            </ul>
          </PopVerdict>
        )}
        {fsaCount > 0 && (
          <>
            <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)] mb-1.5">UK FSA — FOOD ALERTS ({fsaCount})</div>
            <ul className="space-y-2.5">{fsaList.map(h => <FSAHitCard key={h.notation} h={h} />)}</ul>
          </>
        )}
        <p className="mono text-[8px] text-[var(--dim)] mt-3">Agency-reported — openFDA is unvalidated by design; FSA data is OGL v3. Verify at the linked notice before acting. Not medical advice.</p>
      </section>
    </div>
  );
}

interface LiveArgument { caseName: string; court: string; dateArgued: string; audioUrl: string | null; pageUrl: string }

/* UK judgments lane — Find Case Law, The National Archives (Open Justice Licence).
 * Wired live, keyless, CORS-open. Courts belong to Receipts, never Side-Eye. */
function UKCaseLaw() {
  const [state, setState] = useState<'loading' | 'live' | 'unavailable'>('loading');
  const [items, setItems] = useState<{ id: string; title: string; court: string; when: string; url: string }[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchFindCaseLaw(6)
      .then(signals => { if (!alive) return; setItems(signals.map(s => ({ id: s.id, title: s.title, court: s.agency, when: s.publishedAt, url: s.sourceUrl }))); setState(signals.length > 0 ? 'live' : 'unavailable'); })
      .catch(() => { if (alive) setState('unavailable'); });
    return () => { alive = false; };
  }, []);
  return (
    <div className="rounded-xl border border-[var(--line2)] bg-[var(--panel2)] p-3 mt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">UK JUDGMENTS — FIND CASE LAW (OJL) · WIRED LIVE</span>
        {state === 'live' && <span className="mono text-[8px] text-[var(--green)]">LIVE</span>}
      </div>
      {state === 'loading' && <p className="mono text-[10px] text-[var(--dim)] mt-2">CONTACTING THE NATIONAL ARCHIVES…</p>}
      {state === 'unavailable' && <p className="mono text-[9px] text-[var(--gold)] mt-2">Unreachable from this network — nothing fabricated. Browse directly: <a className="text-[var(--cyan)] underline" href="https://caselaw.nationalarchives.gov.uk" target="_blank" rel="noreferrer">caselaw.nationalarchives.gov.uk</a></p>}
      {state === 'live' && <ul className="mt-2 space-y-1.5 max-h-56 overflow-y-auto">{items.map(i => (
        <li key={i.id}>
          <a href={i.url} target="_blank" rel="noreferrer" className="block rounded-lg px-2 py-1.5 hover:bg-[var(--panel)] group">
            <span className="block text-[10.5px] leading-snug text-[var(--ink)] group-hover:text-[var(--gold)] line-clamp-2">{i.title}</span>
            <span className="mono text-[7.5px] text-[var(--dim)] mt-0.5 block">{i.court} · {new Date(i.when).toUTCString().slice(0, 16)}</span>
          </a>
        </li>
      ))}</ul>}
    </div>
  );
}

function DocketSearch({ market }: { market: string }) {
  const [q, setQ] = useState('daubert');
  const [token, setToken] = useState(() => localStorage.getItem('petty-cl-token') ?? '');
  const [tokenDraft, setTokenDraft] = useState('');
  const [liveState, setLiveState] = useState<'idle' | 'loading' | 'live' | 'error' | 'blocked'>('idle');
  const [liveResults, setLiveResults] = useState<LiveArgument[]>([]);

  const deepLink = `https://www.courtlistener.com/?q=${encodeURIComponent(q)}&type=o`;

  const runLive = async () => {
    if (!token.trim()) return;
    setLiveState('loading');
    try {
      const res = await fetch(`https://www.courtlistener.com/api/rest/v4/search/?q=${encodeURIComponent(q)}&type=o`, {
        headers: { Authorization: `Token ${token.trim()}` },
      });
      if (res.status === 401 || res.status === 403) { setLiveState('error'); return; }
      if (!res.ok) throw new Error(String(res.status));
      const raw: unknown = await res.json();
      const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
      const listRaw = isRec(raw) && Array.isArray(raw['results']) ? raw['results'] : [];
      const str = (v: unknown) => (typeof v === 'string' ? v : '');
      const rows = listRaw.filter(isRec).slice(0, 5).map(r => ({
        caseName: str(r['caseName']) || str(r['case_name']) || 'Untitled',
        court: str(r['court']),
        dateArgued: str(r['dateArgued']) || str(r['date_argued']),
        audioUrl: (typeof r['download_url'] === 'string' ? r['download_url'] : null) ?? (typeof r['local_path'] === 'string' ? r['local_path'] : null),
        pageUrl: typeof r['absolute_url'] === 'string' ? `https://www.courtlistener.com${r['absolute_url']}` : deepLink,
      }));
      setLiveResults(rows); setLiveState('live');
    } catch {
      setLiveState('blocked');
    }
  };

  const saveToken = () => { const t = tokenDraft.trim(); if (t) { localStorage.setItem('petty-cl-token', t); setToken(t); setTokenDraft(''); setLiveState('idle'); } };
  const clearToken = () => { localStorage.removeItem('petty-cl-token'); setToken(''); setLiveState('idle'); setLiveResults([]); };

  return (
    <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4">
      <section className="panel p-5">
        <SectionHeader icon={Gavel} kicker="Court watchdog — LIVE" title="Oral arguments, straight from the docket." />
        <p className="text-[12px] text-[var(--dim)] leading-relaxed -mt-2">Free CourtListener account = free API token (125 req/day). Your token never leaves this device except to CourtListener, directly from your browser.</p>
        <form onSubmit={e => { e.preventDefault(); if (token) { void runLive(); } }} className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <FileSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dim)] pointer-events-none" />
            <input value={q} onChange={e => { setQ(e.target.value); setLiveState('idle'); }} placeholder="daubert · opioid · preemption…" className="field pl-9" aria-label="Search oral arguments" />
          </div>
          <button type="submit" className="px-4 rounded-xl border border-[var(--line2)] hover:border-[var(--gold)] hover:text-[var(--gold)] text-sm mono">Search</button>
        </form>

        <div className="mt-3 rounded-xl border border-[var(--line2)] bg-[var(--panel2)] p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">{token ? 'TOKEN SAVED ON THIS DEVICE' : 'PASTE YOUR FREE COURTLISTENER TOKEN'}</span>
            {token
              ? <button onClick={clearToken} className="mono text-[8px] text-[var(--dim)] hover:text-[var(--red)] underline underline-offset-2">forget token</button>
              : <a href="https://www.courtlistener.com/help/api/" target="_blank" rel="noreferrer" className="mono text-[8px] text-[var(--cyan)] hover:underline inline-flex items-center gap-1">get one free <ExternalLink size={9} /></a>}
          </div>
          {!token && (
            <div className="flex gap-2 mt-2">
              <input type="password" value={tokenDraft} onChange={e => { setTokenDraft(e.target.value); }} placeholder="token — stored only on this device" className="field !py-1.5 !text-[11px]" aria-label="CourtListener token" />
              <button onClick={saveToken} className="px-3 rounded-lg border border-[var(--line2)] hover:border-[var(--gold)] hover:text-[var(--gold)] mono text-[10px]">Save</button>
            </div>
          )}
          {token && <button onClick={() => { void runLive(); }} className="mt-2 w-full rounded-lg border border-[var(--cyan)] text-[var(--cyan)] py-1.5 mono text-[9px] tracking-[0.2em] hover:bg-[rgba(89,213,240,0.08)]">{liveState === 'loading' ? 'QUERYING…' : 'RUN LIVE SEARCH — ORAL ARGUMENTS'}</button>}
          {liveState === 'error' && <p className="mono text-[9px] text-[var(--red)] mt-2">Token rejected (401). Re-check or re-issue at courtlistener.com.</p>}
          {liveState === 'blocked' && <p className="mono text-[9px] text-[var(--red)] mt-2">Browser blocked the direct call (CORS). Use the deep link ↓ — same query, pre-filtered.</p>}
          {liveState === 'live' && liveResults.length === 0 && <p className="mono text-[9px] text-[var(--dim)] mt-2">Zero oral arguments match “{q}”.</p>}
          {liveState === 'live' && liveResults.length > 0 && (
            <ul className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {liveResults.map((r, i) => (
                <li key={`${r.pageUrl}-${i}`} className="rounded-lg border border-[var(--line)] p-2.5">
                  <p className="text-[11px] text-[var(--ink)] leading-snug">{r.caseName}</p>
                  <p className="mono text-[8px] text-[var(--dim)] mt-1">{r.court}{r.dateArgued && ` · argued ${r.dateArgued}`}</p>
                  <div className="flex gap-3 mt-1.5">
                    <a href={r.pageUrl} target="_blank" rel="noreferrer" className="mono text-[9px] text-[var(--cyan)] hover:underline">docket ↗</a>
                    {r.audioUrl && <a href={r.audioUrl.startsWith('http') ? r.audioUrl : `https://www.courtlistener.com${r.audioUrl}`} target="_blank" rel="noreferrer" className="mono text-[9px] text-[var(--gold)] hover:underline">download audio → Herald Cuts ↗</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <a href={deepLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[11px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={12} />Open this exact query on CourtListener</a>
        {market === 'GB' && <UKCaseLaw />}
      </section>

      {/* pipeline panel */}
      <section className="panel-flat p-5">
        <div className="mono text-[10px] tracking-[0.25em] text-[var(--dim)] mb-3 flex items-center gap-2"><AudioLines size={11} />DOCKET → CLIP PIPELINE</div>
        <ol className="space-y-3 text-[12px] text-[#c9cddb]">
          {[
            ['1', 'Search arguments on the left (free token, or the deep link without one).'],
            ['2', 'Open the docket, download the argument audio (MP3) — a public record.'],
            ['3', 'Drop the file into Herald Cuts → burned-in 9:16 captions, waveform, attribution.'],
            ['4', 'Post with the source link intact. Attribution required by the licence.'],
          ].map(([n, t]) => (
            <li key={n} className="flex gap-3"><span className="shrink-0 h-6 w-6 rounded-full border border-[var(--gold)] text-[var(--gold)] mono text-[11px] flex items-center justify-center">{n}</span><span className="leading-relaxed">{t}</span></li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl border border-[var(--line2)] p-4 bg-[var(--panel2)]">
          <p className="mono text-[9px] tracking-[0.25em] text-[var(--dim)]">WHAT PETTY NEVER DOES</p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-[#b9bed2]">
            <li>◦ Proxies your keystrokes to CourtListener (background index only in production)</li>
            <li>◦ Invents holdings, quotes or docket numbers — citation-or-silence</li>
            <li>◦ Re-broadcasts recorded dispatch audio as a live stream</li>
            <li>◦ Shows you a verdict Petty has not seen in the source</li>
          </ul>
        </div>
        <p className="mono text-[8px] text-[var(--dim)] mt-3">CourtListener free tier: 5 req/min · 50/hr · 125/day. UK judgments: Find Case Law (Open Justice Licence) — api available to registered users. CanLII / AustLII: licence-gated, shown as such in The Black Book.</p>
      </section>
    </div>
  );
}

/* Server-ingested portal snapshot — appears ONLY when public/recall-cache.json exists
 * (produced by scripts/ingest_recalls.py with a Firecrawl key). Every entry shows
 * provenance; unreachable sources are shown as unreachable. Never fabricated. */
function IngestedPortals() {
  const [cache, setCache] = useState<RecallCache | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let alive = true; void loadRecallCache().then(c => { if (alive) { setCache(c); setFailed(c === null); } }); return () => { alive = false; }; }, []);
  if (failed || cache === null || cache.entries.length === 0) return null;
  const ok = cache.entries.filter(e => e.status === 'ok').length;
  return (
    <section className="rounded-xl border border-[var(--line2)] p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)]">SERVER-INGESTED PORTALS · <span className="text-[var(--gold)]">SCRAPED, MARKED AS SUCH</span></div>
        <div className="mono text-[8px] text-[var(--dim)]">cache {cache.generated_at.replace('T', ' ').slice(0, 16)}Z · {ok}/{cache.entries.length} ok · engine: {cache.engine}</div>
      </div>
      <ul className="mt-2 grid sm:grid-cols-2 gap-1.5">
        {cache.entries.map(e => (
          <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-2.5 py-1.5">
            <a href={e.url} target="_blank" rel="noreferrer" className="mono text-[8px] text-[var(--ink)] hover:text-[var(--cyan)] truncate flex items-center gap-1.5"><ExternalLink size={10} />{e.name}</a>
            <span className={cx('chip', e.status === 'ok' ? 'chip-green' : 'chip-red')}>{e.status === 'ok' ? 'CACHED' : 'UNREACHABLE'}</span>
          </li>
        ))}
      </ul>
      <p className="mono text-[7px] text-[var(--dim)] mt-2">Scraped verbatim from public pages — no summarisation, no invented recalls. Confirmed live by opening the source portal. Discovery-only Firecrawl search results never render here.</p>
    </section>
  );
}

export default function GuardView({ pack }: { pack: CountryPack }) {
  const [tab, setTab] = useState<'scan' | 'docket' | 'cuts' | 'wire' | 'food' | 'pantry'>('scan');
  const [scanSeed, setScanSeed] = useState<{ q: string; k: number } | null>(null);
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-6">
      <div className="p-3 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {([['scan', 'Recall Scanner', ScanLine], ['docket', 'Docket Search', Gavel], ['cuts', 'Herald Cuts', Clapperboard], ['wire', 'Field Wire', Radio], ['food', 'Label Lies', Milk], ['pantry', 'The Pantry', Package]] as const).map(([id, label, I]) => (
            <button key={id} onClick={() => { setTab(id); }} className={cx('flex items-center gap-2 rounded-xl px-4 py-2.5 mono text-[10px] tracking-[0.2em] uppercase border transition-all',
              tab === id ? 'border-[var(--gold)] text-[var(--gold)] bg-[rgba(242,193,78,0.08)]' : 'border-[var(--line2)] text-[var(--dim)] hover:text-[var(--ink)]')}>
              <I size={13} />{label}
            </button>
          ))}
        </div>
        {tab === 'scan' && <Scanner key={scanSeed?.k ?? 'idle'} pack={pack} seed={scanSeed?.q} />}
        {tab === 'scan' && <IngestedPortals />}
        {tab === 'docket' && <DocketSearch market={pack.code} />}
        {tab === 'cuts' && <ClipStudio />}
        {tab === 'wire' && <FieldWire />}
        {tab === 'food' && <FoodFraudCard />}
        {tab === 'pantry' && <PantryLedger onRecallCheck={q => { setScanSeed({ q, k: Date.now() }); setTab('scan'); }} />}
      </div>
    </div>
  );
}
