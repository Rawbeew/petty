import { useEffect, useState } from 'react';
import { Car, Landmark, Radio, ShieldCheck, ExternalLink, TriangleAlert, RefreshCw, CircleCheckBig, CircleSlash } from 'lucide-react';
import { fetchNYPDCollisions, fetchUKCrime, fetchUKStops, UK_TOWNS } from '../lib/live';
import type { UKStopFeed } from '../lib/live';
import type { NYPDCollision } from '../lib/live';
import { SectionHeader } from './Shared';
import { cx } from '../lib/ui';

interface NYPDData { total: number; injured: number; killed: number; rows: NYPDCollision[] }

function BigStat({ label, value, tone }: { label: string; value: string | number; tone?: 'red' | 'gold' | 'green' }) {
  return (
    <div className="rounded-xl border border-[var(--line2)] p-3 text-center">
      <div className={cx('font-display text-2xl', tone === 'red' ? 'text-[var(--red)]' : tone === 'gold' ? 'text-[var(--gold)]' : 'text-[var(--green)]')}>{value}</div>
      <div className="mono text-[8px] tracking-[0.22em] text-[var(--dim)] mt-1">{label}</div>
    </div>
  );
}

function StatusLine({ state }: { state: 'loading' | 'live' | 'offline' | 'empty' }) {
  if (state === 'live') return <span className="flex items-center gap-1.5"><CircleCheckBig size={11} className="text-[var(--green)]" /><span className="text-[var(--green)]">LIVE</span></span>;
  if (state === 'loading') return <span className="text-[var(--dim)]">CONTACTING DATA SOURCE…</span>;
  if (state === 'empty') return <span className="text-[var(--gold)]">NONE PUBLISHED YET — retry later</span>;
  return <span className="flex items-center gap-1.5"><CircleSlash size={11} className="text-[var(--red)]" /><span className="text-[var(--red)]">UNREACHABLE — no fabricated numbers</span></span>;
}

function NYPDBody({ onRetry }: { onRetry: () => void }) {
  const [data, setData] = useState<NYPDData | null>(null);
  const [state, setState] = useState<'loading' | 'live' | 'offline'>('loading');

  useEffect(() => {
    let alive = true;
    let retry: number | undefined;
    const run = (attempt: number) => {
      fetchNYPDCollisions(7, 60)
        .then(d => { if (alive) { setData(d); setState('live'); } })
        .catch(() => { if (!alive) return; if (attempt === 0) retry = window.setTimeout(() => { run(1); }, 3000); else setState('offline'); });
    };
    run(0);
    return () => { alive = false; window.clearTimeout(retry); };
  }, []);

  const boroughs = data ? [...data.rows.reduce((m, r) => m.set(r.borough, (m.get(r.borough) ?? 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]) : [];
  const maxB = Math.max(1, ...boroughs.map(([, n]) => n));

  return (
    <>
      <div className="flex items-center gap-2 mono text-[9px]"><StatusLine state={state} /><span className="text-[var(--dim)]">· crash reports, not radio traffic · NYC Open Data</span></div>
      {data && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <BigStat label="CRASHES · 7D" value={data.total.toLocaleString()} tone="gold" />
            <BigStat label="INJURED" value={data.injured.toLocaleString()} tone="red" />
            <BigStat label="KILLED" value={data.killed.toLocaleString()} tone="red" />
          </div>
          <div>
            <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)] mb-1.5">BY BOROUGH (LATEST 60 REPORTS)</div>
            <div className="space-y-1.5">
              {boroughs.map(([b, n]) => (
                <div key={b} className="flex items-center gap-2">
                  <span className="mono text-[8px] w-24 text-[var(--dim)] truncate">{b}</span>
                  <div className="flex-1 h-3 rounded bg-[#131a2b] overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--gold)] to-[#ffdf8a]" style={{ width: `${(n / maxB) * 100}%` }} /></div>
                  <span className="mono text-[9px] w-6 text-right text-[var(--ink)]">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] mono">
              <thead><tr className="text-[var(--dim)] text-left"><th className="py-1 pr-3">DATE</th><th className="pr-3">BOROUGH</th><th className="pr-3">INJ</th><th className="pr-3">KLD</th><th>FACTOR</th></tr></thead>
              <tbody className="divide-y divide-[var(--line)]">
                {data.rows.slice(0, 4).map(r => (
                  <tr key={r.id}><td className="py-1.5 pr-3 text-[#b9bed2]">{r.date}</td><td className="pr-3">{r.borough}</td><td className="pr-3">{r.injured}</td><td className="pr-3">{r.killed}</td><td className="text-[#8a8fa3] max-w-[140px] truncate" title={r.factor}>{r.factor}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <a href="https://data.cityofnewyork.us/Transportation/Motor-Vehicle-Collisions-Crashes/h9gi-nx95" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={11} />NYC Open Data — collisions (updated daily)</a>
        <button onClick={onRetry} className="p-2 rounded-lg text-[var(--dim)] hover:text-[var(--cyan)]" aria-label="Refresh NYPD feed"><RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} /></button>
      </div>
    </>
  );
}

function UKBody({ townIndex, onRetry }: { townIndex: number; onRetry: () => void }) {
  const town = UK_TOWNS[townIndex] ?? UK_TOWNS[0];
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchUKCrime>> | null>(null);
  const [stops, setStops] = useState<{ town: number; feed: UKStopFeed | null } | null>(null);
  const [state, setState] = useState<'loading' | 'live' | 'offline' | 'empty'>('loading');

  useEffect(() => {
    let alive = true;
    let retry: number | undefined;
    const run = (attempt: number) => {
      fetchUKCrime(town.lat, town.lng)
        .then(d => { if (alive) { setData(d); setState(d ? 'live' : 'empty'); } })
        .catch(() => { if (!alive) return; if (attempt === 0) retry = window.setTimeout(() => { run(1); }, 3000); else setState('offline'); });
      fetchUKStops(town.lat, town.lng)
        .then(feed => { if (alive) setStops({ town: townIndex, feed }); })
        .catch(() => { /* stop feed optional; crime panel remains the primary signal */ });
    };
    run(0);
    return () => { alive = false; window.clearTimeout(retry); };
  }, [town, townIndex]);

  return (
    <>
      <div className="mono text-[9px] flex items-center gap-2"><StatusLine state={state} />{state === 'live' && <span className="text-[var(--dim)]">· month {data?.month} (~2 months in arrears)</span>}<span className="text-[var(--dim)]">· data.police.uk</span></div>
      {data && (
        <>
          <BigStat label={`RECORDED CRIMES · ${data.month} · 1 MILE RADIUS`} value={data.total.toLocaleString()} tone="gold" />
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {data.byCategory.map(c => {
              const max = data.byCategory[0]?.count ?? 1;
              return (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="mono text-[8px] w-40 text-[var(--dim)] truncate" title={c.category}>{c.category.replace(/-/g, ' ')}</span>
                  <div className="flex-1 h-3 rounded bg-[#131a2b] overflow-hidden"><div className="h-full bg-gradient-to-r from-[#59d5f0] to-[#b9f0ff]" style={{ width: `${(c.count / max) * 100}%` }} /></div>
                  <span className="mono text-[9px] w-8 text-right">{c.count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      {/* stops-and-search — same OGL v3 feed family, same 1-mile snapped geometry */}
      <div className="rounded-xl border border-[var(--line2)] p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="mono text-[9px] tracking-[0.25em] text-[var(--dim)]">STOPS + SEARCHES · {stops !== null && stops.town === townIndex && stops.feed !== null ? stops.feed.month : '…'}</span>
          <span className="mono text-[8px] text-[var(--dim)]">data.police.uk · OGL v3</span>
        </div>
        {stops?.town !== townIndex
          ? <p className="mono text-[10px] text-[var(--dim)] mt-2">CONTACTING STOPS FEED…</p>
          : stops.feed === null
            ? <p className="mono text-[10px] text-[var(--gold)] mt-2">NONE PUBLISHED FOR THIS MONTH — forces report stops separately from crime; absence is not zero enforcement.</p>
            : <>
              <div className="font-display text-xl text-[var(--ink)] mt-1.5">{stops.feed.total.toLocaleString()} <span className="text-[10px] mono text-[var(--dim)]">STOPS · {stops.feed.month}</span></div>
              <ul className="mt-1.5 space-y-1">
                {stops.feed.top.map(t => <li key={t.label} className="flex items-center justify-between gap-2"><span className="mono text-[8px] text-[var(--dim)] truncate">{t.label}</span><span className="mono text-[9px] text-[var(--ink)]">{t.count}</span></li>)}
              </ul>
            </>}
      </div>
      <p className="mono text-[8px] text-[var(--dim)] leading-relaxed">Open Government Licence v3.0 · locations snapped to nearest street node — never a home address · stops are powers exercised, not crimes · <button onClick={onRetry} className="text-[var(--cyan)] hover:underline">refresh ↗</button> <a className="text-[var(--cyan)] hover:underline" href="https://data.police.uk/docs/method/stops-street/" target="_blank" rel="noreferrer">stops methodology ↗</a></p>
    </>
  );
}

export default function FieldWire() {
  const [nycReload, setNycReload] = useState(0);
  const [ukReload, setUkReload] = useState(0);
  const [town, setTown] = useState(0);

  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <section className="panel p-5 space-y-4">
        <SectionHeader icon={Car} kicker="LIVE · Socrata SODA — h9gi-nx95" title="NYPD collisions — this week" />
        <NYPDBody key={nycReload} onRetry={() => { setNycReload(r => r + 1); }} />
      </section>
      <section className="panel p-5 space-y-4">
        <SectionHeader icon={Landmark} kicker="LIVE · data.police.uk — crimes-street" title="UK street-level density"
          right={<select value={town} onChange={e => { setTown(Number(e.target.value)); }} className="field !py-1.5 !text-[11px] w-auto" aria-label="Choose town">{UK_TOWNS.map((t, i) => <option key={t.name} value={i}>{t.name}</option>)}</select>} />
        <UKBody key={`${town}:${ukReload}`} townIndex={town} onRetry={() => { setUkReload(r => r + 1); }} />
      </section>

      {/* Police radio — the lawful lanes */}
      <section className="panel p-5 xl:col-span-2">
        <SectionHeader icon={Radio} kicker="Lawful lanes only" title="About police radio — why there is no free live feed" />
        <div className="grid md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
          <div className="rounded-xl border border-[rgba(255,90,90,0.3)] bg-[rgba(255,90,90,0.05)] p-4">
            <div className="flex items-center gap-2 text-[var(--red)] mono text-[9px] tracking-[0.25em]"><CircleSlash size={12} />DOES NOT EXIST (FREE)</div>
            <p className="mt-2 text-[#d8d5c9]">A free, legal, live police-radio <em>audio API</em> does not exist. Broadcastify streams are HTML players under their ToS — re-streaming or scraping them is a licence breach and (in one-party-consent jurisdictions) unlawful interception exposure.</p>
          </div>
          <div className="rounded-xl border border-[rgba(89,213,240,0.3)] bg-[rgba(89,213,240,0.05)] p-4">
            <div className="flex items-center gap-2 text-[var(--cyan)] mono text-[9px] tracking-[0.25em]"><ShieldCheck size={12} />THE LAWFUL LANE</div>
            <p className="mt-2 text-[#c9d8dd]">Broadcastify <strong>Calls API</strong> — recorded, event-tagged county trunk audio; metered commercial licence; attribution required. Petty wires it server-side in Phase 2 (never in browser, key never client-side) — production pipeline: event → K-anon grid cell → “recorded incident near…” card.</p>
            <a href="https://www.broadcastify.com/calls" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[10px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={11} />broadcastify.com/calls</a>
          </div>
          <div className="rounded-xl border border-[var(--line2)] p-4">
            <div className="flex items-center gap-2 text-[var(--gold)] mono text-[9px] tracking-[0.25em]"><TriangleAlert size={12} />WHAT PETTY SHIPS</div>
            <p className="mt-2 text-[#c9cddb]">Live open aggregates (left panels), deterministically grid-snapped — never a pin, never a plate. Dispatch audio stays <em>recorded + unconfirmed</em> until corroborated, matching §4 of the Petty spec. Your safety triage doesn’t need the 46th blip — it needs the pattern.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
