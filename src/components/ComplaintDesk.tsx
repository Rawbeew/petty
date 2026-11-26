/* The Complaint Desk — guided OFFICIAL complaints for restaurants & services.
 * Routing is a deterministic phrase-rules engine (expert-system style) — no AI, every
 * match shown. Evidence photos stay on this device (IndexedDB). Petty never files for
 * you, never posts publicly, never rates or shames — you write, you send, agencies decide. */
import { useState } from 'react';
import { Landmark, Camera, FileText, ShieldCheck, ExternalLink, TriangleAlert, Wand2, CheckCircle2 } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';
import PhotoEvidence from './PhotoEvidence';
import { cx, downloadText } from '../lib/ui';
import { LANES, routeComplaint, type LaneId, type RouteResult } from '../lib/complaints';
import { useCaseFile } from '../lib/caseFile';
import { US_STATES, stateByCode, isStateAG } from '../data/states';
import { safeGet, safeSet } from '../lib/safeStorage';
import { buildComplaintLetter } from '../lib/complaintLetters';

export default function ComplaintDesk() {
  const [lane, setLane] = useState<LaneId>('food_illness');
  const { c, set, clear } = useCaseFile();
  const business = c.business; const date = c.date; const what = c.what; const ill = c.ill;
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [stateCode, setStateCode] = useState<string>(() => safeGet('petty.ag.state') ?? '');
  const isLaneId = (v: string): v is LaneId => LANES.some(l => l.id === v);
  const AG_Routed = (id: LaneId) => id === 'contractor' || id === 'auto_repair' || id === 'debt' || id === 'other';
  const ag = isStateAG(stateCode) ? stateByCode(stateCode) : null;
  const pickState = (code: string) => { setStateCode(code); safeSet('petty.ag.state', code); };
  const first = LANES[0];
  if (first === undefined) return null; // static table — unreachable
  const active = LANES.find(l => l.id === lane) ?? first;

  const analyze = () => {
    const r = routeComplaint(what, { ill });
    setRoute(r);
    if (r.best && !r.needsManual) setLane(r.best.lane);
  };
  const editFacts = (fn: () => void) => { fn(); setRoute(null); };

  const generate = () => {
    downloadText('petty-official-complaint.txt', buildComplaintLetter(lane, { business, date, what, ill }, ag));
  };

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Landmark} kicker="Complaint desk — US" title="Report it to whoever can actually punish them." right={<span className="chip chip-cyan">NO PUBLIC SHAMING — EVER</span>} />
      <p className="text-[11px] text-[#c9cddb] leading-relaxed">Petty does not post reviews, run ratings, or name-and-shame businesses. What moves the needle: an official complaint to the regulator that actually has teeth. Tell it what happened in plain words — a rules engine (no AI, every matched phrase shown) proposes the lane; you confirm or override:</p>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line2)] px-3 py-2">
        <span className="mono text-[8px] tracking-[0.2em] text-[var(--dim)]">CASE FILE — ON THIS DEVICE{c.updatedAt ? ` · SAVED ${new Date(c.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}` : ''}</span>
        <button onClick={() => { if (window.confirm('Erase the case file on this device? (Photos in Food-fraud/Complaint are erased separately, per item.)')) clear(); }} className="mono text-[8px] text-[#e6a2a2] hover:text-[#ff8a8a]">CLEAR CASE FILE</button>
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2.5">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><Wand2 size={10} />STEP 1 — WHAT HAPPENED (PLAIN WORDS)</div>
        <textarea className="field min-h-[88px]" placeholder="e.g. Roofer took my $3,000 deposit in October and never came back. His license number is on the truck…" value={what} onChange={e => { editFacts(() => { set('what', e.target.value); }); }} aria-label="What happened" />
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={analyze} disabled={!what.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold px-5 py-2.5 mono text-[9px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)] disabled:opacity-40"><Wand2 size={12} />Route it — keyword rules, no AI</button>
          <label className="flex items-center gap-2 text-[11px] text-[var(--dim)]"><input type="checkbox" checked={ill} onChange={e => { editFacts(() => { set('ill', e.target.checked); }); }} className="accent-[#F2C14E] h-4 w-4" />Someone was made ill or hurt</label>
        </div>

        {route && (
          <div className="rounded-xl border border-[var(--line2)] p-3 space-y-2" aria-live="polite">
            <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">STEP 2 — THE ENGINE'S PROPOSAL (OVERRIDABLE)</div>
            {route.best && !route.needsManual ? (
              <>
                <p className="text-[12px] text-[var(--ink)] flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--green)] shrink-0" /><span><span className="text-[var(--gold)]">{LANES.find(l => l.id === route.best?.lane)?.label ?? route.best.lane}</span> — confidence {route.confidence.toUpperCase()} · matched: {route.best.matches.join(' · ')}</span></p>
              </>
            ) : (
              <p className="text-[11px] text-[#e6c87a] flex items-start gap-2"><TriangleAlert size={12} className="mt-0.5 shrink-0" />Not enough of your words matched any rule confidently — pick the lane below yourself. (Low confidence is the honest answer, not a guess.)</p>
            )}
            {route.hits.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5"><span className="mono text-[8px] text-[var(--dim)]">ALSO MATCHED:</span>{route.hits.slice(1, 5).map(h => (
                <button key={h.lane} onClick={() => { setLane(h.lane); }} className="chip hover:border-[var(--gold)] hover:text-[var(--ink)]" title={`Matched: ${h.matches.join(', ')}`}>{LANES.find(l => l.id === h.lane)?.label ?? h.lane} ({h.score.toFixed(1).replace(/\.0$/, '')})</button>
              ))}</div>
            )}
          </div>
        )}

        <div>
          <label className="lbl" htmlFor="lane">Lane (tap to override)</label>
          <select id="lane" className="field" value={lane} onChange={e => { setLane(isLaneId(e.target.value) ? e.target.value : 'other'); }}>{LANES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">YOUR STATE — ALL 50 + DC AUDITED 2026-11-26</div>
          <select className="field !w-auto text-[10px]" value={stateCode} onChange={e => { pickState(e.target.value); }} aria-label="Your state"><option value="">— pick your state —</option>{US_STATES.map(st => <option key={st.code} value={st.code}>{st.code} — {st.name}</option>)}</select></div>
        {stateCode && ag && (<div className="text-[10px] text-[var(--dim)] space-y-1"><p>{ag.office}{ag.status === 'bot-walled' ? ' — official portal, may block bots; opens in your browser' : ag.status === 'unverified' ? ' — not linked: the official domain redirects off-gov; search the name in your browser' : ''}</p>{ag.url && <a href={ag.url} target="_blank" rel="noreferrer" className="mono text-[var(--cyan)] break-all hover:underline inline-flex items-center gap-1">{ag.url}<ExternalLink size={9} /></a>}<p className="mono text-[8px]">Applies to the AG-routed lanes (contractor · auto repair · debt · other). Federal lanes ignore this.</p></div>)}
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><Landmark size={10} className="text-[var(--gold)]" />WHERE THIS GOES</div>
        <p className="text-[12px] text-[var(--ink)]">{ag && AG_Routed(active.id) ? `${ag.office} — file the AG consumer complaint (portal below)` : active.who}</p>
        <p className="text-[11px] text-[#c9cddb]">{active.how}</p>
        <p className="text-[10px] mono text-[var(--cyan)] break-words">{active.portal}</p>
        <p className="text-[10px] text-[var(--dim)] leading-relaxed"><TriangleAlert size={10} className="inline text-[var(--gold)] mr-1" />{active.note}</p>
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><Camera size={10} className="text-[var(--cyan)]" />EVIDENCE — STAYS ON THIS DEVICE</div>
        <PhotoEvidence scope="case" />
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2.5">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><FileText size={10} />STEP 3 — THE LETTER FOR THIS LANE (EACH LANE IS ITS OWN)</div>
        <div className="grid grid-cols-2 gap-2.5">
          <input className="field col-span-2" placeholder="Business / establishment (name as it appeared)" value={business} onChange={e => { set('business', e.target.value); }} aria-label="Business name" />
          <input className="field" type="date" value={date} onChange={e => { set('date', e.target.value); }} aria-label="Date of incident" />
        </div>
        <button onClick={generate} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[rgba(242,193,78,0.1)]"><FileText size={13} />Generate {active.id === 'food_illness' ? 'foodborne-illness' : active.id.replace('_', '-')} complaint letter (.txt)</button>
      </div>
      <div className="flex items-start gap-2 text-[9px] mono text-[var(--dim)]"><ShieldCheck size={11} className="text-[var(--green)] mt-0.5 shrink-0" /><span>Routing is a weighted keyword engine — it shows its matched phrases and admits when it can't match. Petty never files anything and never contacts anyone for you — you send. UK readers: Citizens Advice + local Trading Standards, FSA for food. Information, not legal advice.</span></div>
      <p className={cx('mono text-[8px] text-[var(--dim)] flex items-center gap-1')}>External portals open at the addresses shown — Petty does not proxy or vouch for their live availability. <ExternalLink size={9} /></p>
    </section>
  );
}
