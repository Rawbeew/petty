import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, ExternalLink, Download, Link2, CloudLightning, HeartPulse, Siren, TrafficCone, Banknote, LayoutGrid, Search, Eye, RadioTower, RefreshCw, ShieldQuestion, Landmark, LockKeyhole } from 'lucide-react';
import type { SafetySignal, Pillar } from '../data/signals';
import { COUNTRY_PACKS, RADAR_PILLARS } from '../data/packs';
import type { CountryPack } from '../data/packs';
import { ConfidenceBadge } from './ui/ConfidenceBadge';
import { cx, timeAgo, useGlow } from '../lib/ui';
import { fetchOpenFDA, fetchNWSAlerts, fetchCPSCRecalls, fetchFSAAsSignals, fetchECCCWeatherAlerts, fetchWHONews } from '../lib/live';
import useSafetyCard from './SafetyCard';
import { Stagger, StaggerItem } from './ui/Motion';
import { EmptyState } from './ui/EmptyState';

const PILLAR_ICON: Record<Pillar, typeof HeartPulse> = {
  health: HeartPulse, weather: CloudLightning, dispatch: Siren, stops: TrafficCone, courts: Landmark, money: Banknote, luggage: Landmark,
};
const SEV_COLOR: Record<SafetySignal['severity'], string> = { critical: '#ff5a5a', high: '#f2c14e', moderate: '#59d5f0', watch: '#8a8fa3' };
const isSeverityFilter = (v: string): v is 'all' | SafetySignal['severity'] => v === 'all' || v === 'critical' || v === 'high' || v === 'moderate' || v === 'watch';

const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function RadarScope({ signals, selected, onSelect }: { signals: SafetySignal[]; selected: SafetySignal | null; onSelect: (s: SafetySignal) => void }) {
  const noise = useMemo(() => { const r = mulberry32(42); return Array.from({ length: 260 }, () => ({ x: r() * 800, y: r() * 480, o: 0.05 + r() * 0.12, rad: r() * 1.1 + 0.3 })); }, []);
  const cxp = 400, cyp = 240, rx = 365, ry = 225;
  const proj = (lat: number, lng: number) => ({ x: cxp + (lng / 180) * rx * 0.96, y: cyp - (lat / 90) * ry * 0.96 });
  return (
    <svg viewBox="0 0 800 480" className="w-full h-full select-none" role="img" aria-label="Live Side-Eye scope of agency-reported signals">
      <defs>
        <clipPath id="globeClip"><ellipse cx={cxp} cy={cyp} rx={rx} ry={ry} /></clipPath>
        <radialGradient id="globeFill" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#131a2b" /><stop offset="100%" stopColor="#080b12" />
        </radialGradient>
        <linearGradient id="sweepGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#F2C14E" stopOpacity="0.55" /><stop offset="100%" stopColor="#F2C14E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx={cxp} cy={cyp} rx={rx} ry={ry} fill="url(#globeFill)" stroke="#232b40" strokeWidth="1.5" />
      <g clipPath="url(#globeClip)">
        {noise.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.rad} fill="#cfe3ff" opacity={n.o} />)}
        {[0.55, 0.32, 0.12].map((k, i) => <ellipse key={i} cx={cxp} cy={cyp} rx={rx * k} ry={ry} fill="none" stroke="#1d2740" strokeWidth="1" />)}
        {[-150, -100, -50, 0, 50, 100, 150].map(d => {
          const half = rx * Math.sqrt(Math.max(0, 1 - (d / ry) ** 2));
          return <line key={d} x1={cxp - half} y1={cyp + d} x2={cxp + half} y2={cyp + d} stroke={d === 0 ? '#2a3450' : '#1d2740'} strokeWidth="1" />;
        })}
        <g className="sweep">
          <path d={`M ${cxp} ${cyp} L ${cxp} ${cyp - ry} A ${rx} ${ry} 0 0 1 ${cxp + rx * 0.72} ${cyp - ry * 0.72} Z`} fill="url(#sweepGrad)" opacity="0.85" />
          <line x1={cxp} y1={cyp} x2={cxp} y2={cyp - ry} stroke="#F2C14E" strokeWidth="1.4" strokeOpacity="0.8" />
        </g>
        {signals.map(s => {
          const p = proj(s.lat, s.lng);
          const active = selected?.id === s.id;
          return (
            <g key={s.id} transform={`translate(${p.x} ${p.y})`} onClick={() => { onSelect(s); }} className="cursor-pointer">
              <circle r="14" fill="transparent" />
              <circle className="ping-ring" r="6" fill="none" stroke={SEV_COLOR[s.severity]} strokeWidth="1.5" />
              <circle className="blip" r="4" fill={SEV_COLOR[s.severity]} stroke="#06080d" strokeWidth="1.2" />
              {active && <circle r="8.5" fill="none" stroke="#F2C14E" strokeWidth="1.6" strokeDasharray="3 3" />}
            </g>
          );
        })}
      </g>
      <ellipse cx={cxp} cy={cyp} rx={rx} ry={ry} fill="none" stroke="#2f3a57" strokeWidth="1.2" />
      <text x={20} y={462} fill="#4c5470" fontSize="11" fontFamily="ui-monospace">AGENCY-REPORTED ONLY · K-ANONYMITY ≥25/CELL</text>
      <text x={780} y={462} fill="#4c5470" fontSize="11" fontFamily="ui-monospace" textAnchor="end">{signals.length} SIGNALS</text>
    </svg>
  );
}

export default function RadarView({ pack }: { pack: CountryPack }) {
  const [pillar, setPillar] = useState<Pillar | 'all'>('all');
  const [sev, setSev] = useState<'all' | SafetySignal['severity']>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<SafetySignal | null>(null);
  const [live, setLive] = useState<SafetySignal[]>([]);
  const [liveState, setLiveState] = useState<'loading' | 'live' | 'offline'>('loading');
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const exportCard = useSafetyCard();
  const glow = useGlow<HTMLButtonElement>();

  /* Every launch market with at least one CORS-keyless, verified machine feed.
   * AU: TGA/FSANZ/BOM expose no keyless JSON/GeoJSON API reachable from this network — explicit unsupported state, never filler. */
  const liveSupported = pack.code === 'US' || pack.code === 'GL' || pack.code === 'GB' || pack.code === 'CA';

  const fetchLive = useCallback((): Promise<void> => {
    if (!liveSupported) return Promise.resolve();
    const jobs: Promise<SafetySignal[]>[] =
      pack.code === 'US' ? [fetchOpenFDA(8), fetchCPSCRecalls(45, 4), fetchNWSAlerts(6)]
      : pack.code === 'GB' ? [fetchFSAAsSignals(6)]
      : pack.code === 'CA' ? [fetchECCCWeatherAlerts(8)]
      : [fetchWHONews(5)];
    return Promise.allSettled(jobs).then(results => {
      const merged = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setLive(merged);
      setLiveState(merged.length > 0 ? 'live' : 'offline');
      setSyncedAt(new Date().toISOString());
    });
  }, [liveSupported, pack.code]);
  const loadLive = () => { setLiveState('loading'); void fetchLive(); };
  useEffect(() => { void fetchLive(); }, [fetchLive]);

  const pool = useMemo(() => (liveSupported ? live : []), [live, liveSupported]);
  const visible = useMemo(() => pool.filter(s =>
    (pillar === 'all' || s.pillar === pillar) &&
    (sev === 'all' || s.severity === sev) &&
    (!q.trim() || `${s.title} ${s.agency} ${s.tags.join(' ')} ${s.summary}`.toLowerCase().includes(q.toLowerCase()))
  ), [pool, pillar, sev, q]);
  const critical = visible.filter(v => v.severity === 'critical').length;
  const healthRegs = pack.regulators.filter(r => r.pillar === 'health' || r.pillar === 'weather');

  return (
    <div className="relative h-full overflow-y-auto pb-20 md:pb-6">
      {/* live-wire status banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#070d12] border-y border-[var(--line)] text-[10px] sm:text-[11px] text-[#9fdcff]">
        <RadioTower size={12} className={liveState === 'live' ? 'text-[var(--green)]' : 'text-[var(--dim)]'} />
        <span className="mono">
          {liveSupported
            ? liveState === 'live' && `LIVE — ${({ US: 'openFDA · CPSC · NWS', GB: 'FSA food alerts', CA: 'ECCC GeoMet', GL: 'WHO news (90d)' } as Record<string, string>)[pack.code] ?? 'open gov'} · synced ${syncedAt ? timeAgo(syncedAt) : 'now'} · every card links to its source agency.`
            : `${pack.name}: no keyless, CORS-open machine feed verified for this market — registry below links the official portals. Live wire: US · GB · CA · GL.`}
          {liveState === 'loading' && 'CONTACTING SOURCE AGENCIES…'}
          {liveState === 'offline' && 'SOURCES UNREACHABLE FROM THIS NETWORK (or upstream 5xx) — nothing fabricated; retry or verify at source.'}
        </span>
        {liveSupported && <button onClick={loadLive} aria-label="Re-sync live feeds" className="ml-auto p-1 rounded hover:bg-[var(--panel2)] text-[var(--dim)] hover:text-[var(--cyan)]"><RefreshCw size={12} className={liveState === 'loading' ? 'animate-spin' : ''} /></button>}
      </div>

      <div className="p-3 sm:p-5 space-y-4">
        {/* stats strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
          {[['SIGNALS', String(visible.length)], ['CRITICAL', String(critical)], ['MARKETS', pack.code === 'GL' ? 'GL' : pack.code], ['MEDIAN AGE', visible.length ? timeAgo(visible[visible.length - 1]?.publishedAt ?? new Date().toISOString()).replace(' ago', '') : '—']].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2"><span className="mono text-[9px] tracking-[0.22em] text-[var(--dim)]">{k}</span><span className="font-display text-lg text-[var(--ink)]">{v}</span></div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.18fr_1fr] gap-4">
          {/* Scope */}
          <section className="panel p-3 sm:p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2 text-[10px] mono tracking-[0.25em] text-[var(--gold)]"><Eye size={12} />THE SIDE-EYE — {pack.name.toUpperCase()}</div>
              <span className="mono text-[9px] text-[var(--dim)]">SWEEP 7.0s</span>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[#05070c] aspect-[5/3] overflow-hidden">
              <RadarScope signals={visible} selected={selected} onSelect={setSelected} />
            </div>
            {/* pillar filters */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button onClick={() => { setPillar('all'); }} className={cx('chip', pillar === 'all' && 'chip-gold')}><LayoutGrid size={10} />All pillars</button>
              {RADAR_PILLARS.map(p => { const I = PILLAR_ICON[p.id]; return (
                <button key={p.id} onClick={() => { setPillar(pillar === p.id ? 'all' : p.id); }} title={p.blurb} className={cx('chip', pillar === p.id && 'chip-gold')}><I size={10} />{p.label.split(' ')[0]}</button>
              ); })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--dim)] pointer-events-none" />
                <input value={q} onChange={e => { setQ(e.target.value); }} placeholder="Search agency, product, keyword…" className="field pl-8 !py-2 text-xs" aria-label="Search signals" />
              </div>
              <select value={sev} onChange={e => { const v = e.target.value; if (isSeverityFilter(v)) setSev(v); }} className="field w-auto !py-2 text-xs" aria-label="Filter severity">
                <option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="moderate">Moderate</option><option value="watch">Watch</option>
              </select>
            </div>
          </section>

          {/* Feed */}
          <section className="panel-flat rise-in rise-in-d1 flex flex-col max-h-[640px] lg:max-h-none lg:h-full overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-[var(--line)] flex items-center justify-between">
              <span className="mono text-[10px] tracking-[0.25em] text-[var(--dim)]">VERIFIED LEDGER — {visible.length} EVENTS</span>
              {syncedAt && <span className="flex items-center gap-1.5 mono text-[9px] text-[var(--green)]"><span className="dot live-dot" style={{ background: '#3ddc97' }} />SYNCED {timeAgo(syncedAt).toUpperCase()}</span>}
            </div>
            <div className="overflow-y-auto divide-y divide-[var(--line)]">
              {visible.length === 0 && (
                <EmptyState icon={ShieldQuestion} title={liveState === 'loading' ? 'Contacting source agencies…' : liveSupported ? 'No matching agency-reported events for this filter.' : `No verified wire for ${pack.name} yet.`}>
                  Petty does not fill silence with fiction. Verify directly at the official portals for this market:
                  <ul className="mt-3 space-y-1.5 text-left">
                    {healthRegs.slice(0, 4).map((r, i) => (
                      <li key={i}><a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] mono text-[var(--cyan)] hover:underline"><ExternalLink size={11} />{r.name}</a></li>
                    ))}
                  </ul>
                </EmptyState>
              )}
              <Stagger>
              {visible.map(s => {
                const I = PILLAR_ICON[s.pillar];
                return (
                  <StaggerItem key={s.id} className="border-b border-[var(--line)]">
                  <button onClick={() => { setSelected(s); }} onMouseMove={glow}
                    className="glow-card card-hover w-full text-left grid grid-cols-[3px_1fr_auto] gap-3 px-3 sm:px-4 py-3 hover:bg-[var(--panel2)] transition-colors">
                    <span style={{ background: SEV_COLOR[s.severity] }} className="rounded-full" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-[9px] mono text-[var(--dim)]"><I size={10} className="text-[var(--gold)]" />{s.agency.toUpperCase()}<span>·</span>{s.country}<span>·</span>{timeAgo(s.publishedAt)}</span>
                      <span className="block font-display text-[13.5px] leading-snug text-[var(--ink)] mt-1 line-clamp-2">{s.title}</span>
                      <span className="flex gap-1.5 mt-1.5 items-center"><ConfidenceBadge c={s.confidence} /><span className="chip chip-green"><span className="dot" style={{ background: '#3ddc97' }} />LIVE · API</span></span>
                    </span>
                    <span className="self-center text-[var(--dim)]">›</span>
                  </button>
                  </StaggerItem>
                );
              })}
              </Stagger>
            </div>
          </section>
        </div>

        {/* UNCLAIMED MONEY — always-visible verified gateways. No honest API exists anywhere;
            Petty links official portals, never fabricates matches. */}
        <section className="panel p-4 sm:p-5" aria-label="Unclaimed money — verified official gateways">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg border border-[rgba(242,193,78,0.35)] bg-[rgba(242,193,78,0.08)] p-1.5"><Banknote size={16} className="text-[var(--gold)]" /></span>
              <div>
                <div className="mono text-[9px] tracking-[0.3em] text-[var(--gold)]">THE PETTY LEDGER — VERIFIED GATEWAYS</div>
                <h2 className="font-display text-base mt-0.5">Is money waiting for you?</h2>
              </div>
            </div>
            <span className="mono text-[8px] text-[var(--dim)] max-w-[260px] text-right">NO PUBLIC API EXISTS ANYWHERE — Petty never invents matches. Check each gateway yourself.</span>
          </div>
          <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...pack.regulators, ...(COUNTRY_PACKS.find(p => p.code === 'GL')?.regulators ?? [])].filter(r => r.pillar === 'money').map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-start gap-2 rounded-xl border border-[var(--line)] hover:border-[rgba(242,193,78,0.4)] p-3 h-full transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
                  <Landmark size={13} className="mt-0.5 shrink-0 text-[var(--dim)] group-hover:text-[var(--gold)]" />
                  <span className="min-w-0">
                    <span className="block text-[11px] leading-snug text-[var(--ink)]">{r.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 mono text-[7px] text-[var(--dim)] uppercase">{r.status === 'bot-walled' ? <LockKeyhole size={8} /> : <ExternalLink size={8} />}{r.status.replace('-', ' ')} · verify at source</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mono text-[7.5px] text-[var(--dim)] mt-2 leading-relaxed">Government-held unclaimed balances are found ONLY on the official portals linked above. Anyone selling you a guaranteed list is defrauding you. Flat subscription · never a percentage of the recovery (see The Black Book).</p>
        </section>
      </div>

      {/* Verbatim drawer — Esc closes; focus lands on the close button */}
      <DrawerA11y selected={selected} onClose={() => { setSelected(null); }} />
      {selected && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={selected.title}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setSelected(null); }} />
          <aside className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--panel)] border-l border-[var(--line2)] flex flex-col slide-in">
            <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--line)]">
              <span className="mono text-[10px] tracking-[0.25em] text-[var(--gold)]">VERBATIM SOURCE DRAWER</span>
              <button id="verbatim-close" onClick={() => { setSelected(null); }} aria-label="Close" className="p-2 rounded-lg hover:bg-[var(--panel2)] text-[var(--dim)] hover:text-[var(--ink)]"><X size={17} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap"><ConfidenceBadge c={selected.confidence} /><span className="chip">{selected.severity.toUpperCase()}</span></div>
              <h3 className="font-display text-xl leading-snug">{selected.title}</h3>
              <div className="mono text-[10px] text-[var(--dim)]">{selected.agency} · {selected.country} · {new Date(selected.publishedAt).toUTCString()}</div>
              <p className="text-[13px] leading-relaxed text-[#c9cddb]">{selected.summary}</p>
              <figure className="rounded-xl border border-[var(--line2)] bg-[#0a0d14] p-4">
                <figcaption className="mono text-[9px] tracking-[0.25em] text-[var(--cyan)] mb-2">◆ SOURCE TEXT — VERBATIM (LIVE · OPEN-GOVT API)</figcaption>
                <blockquote className="mono text-[11.5px] leading-relaxed text-[#b9e3ef]">“{selected.rawOfficialText}”</blockquote>
              </figure>
              <div className="flex gap-2">
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--line2)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors px-3 py-2.5 text-xs mono"><ExternalLink size={13} />Verify at source</a>
                <button onClick={() => { void navigator.clipboard.writeText(selected.sourceUrl); }} className="px-3 py-2.5 rounded-xl border border-[var(--line2)] hover:text-[var(--gold)] text-[var(--dim)]" aria-label="Copy source link"><Link2 size={15} /></button>
              </div>
              <button onClick={() => { exportCard(selected); }} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold px-4 py-3 text-xs mono tracking-[0.18em] uppercase hover:bg-[var(--gold2)] transition-colors"><Download size={15} />Export 9:16 Safety Card</button>
              <p className="mono text-[9px] text-[var(--dim)] leading-relaxed">Safety Card carries the verbatim quote, agency, date, confidence status and source link. Information, not advice. Petty is not affiliated with any listing agency.</p>
            </div>
          </aside>
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(48px); opacity: .4; } to { transform: none; opacity: 1; } }`}</style>
    </div>
  );
}

function DrawerA11y({ selected, onClose }: { selected: unknown; onClose: () => void }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (selected === null) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => { document.getElementById('verbatim-close')?.focus(); }, 30);
    return () => { document.removeEventListener('keydown', onKey); window.clearTimeout(t); returnFocus.current?.focus(); };
  }, [selected, onClose]);
  return null;
}
