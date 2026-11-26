/* Unpaid wages / final paycheck — FLSA § 216(b) double-dipping made visible, state layers on top.
 * US launch ring only. Information, not legal advice. */
import { useState } from 'react';
import { Banknote, ExternalLink, ShieldCheck } from 'lucide-react';
import { WAGE_STATUTES } from '../data/packets';
import { computeWageClaim, type WageInput } from '../lib/packets';
import { SectionHeader } from './ui/SectionHeader';
import { PopVerdict } from './ui/Motion';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
type WageState = WageInput['state'];

export default function WagePacket() {
  const [state, setState] = useState<WageState>('NY');
  const [unpaid, setUnpaid] = useState(3000);
  const [otHours, setOtHours] = useState(40);
  const [rate, setRate] = useState(22);
  const [lateDays, setLateDays] = useState(14);
  const [dailyRate, setDailyRate] = useState(176);
  const entry = WAGE_STATUTES.find(w => w.state === state);
  const verdict = computeWageClaim({ state, unpaidWagesUsd: unpaid, otHours, hourlyRateUsd: rate, finalPayDaysLate: lateDays, dailyRateUsd: dailyRate });

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Banknote} kicker="Unpaid wages — US" title="The double-damage engine" right={<span className="chip chip-cyan"><ShieldCheck size={10} />FLSA § 216(b)</span>} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <div><label className="lbl" htmlFor="ws">State</label>
          <select id="ws" className="field" value={state} onChange={e => { const next = WAGE_STATUTES.find(w => w.state === e.target.value); if (next) setState(next.state); }}>
            {WAGE_STATUTES.map(w => <option key={w.state} value={w.state}>{w.state}</option>)}</select></div>
        <div><label className="lbl" htmlFor="uw">Straight wages owed ($)</label><input id="uw" type="number" min={0} className="field" value={unpaid} onChange={e => { setUnpaid(Number(e.target.value)); }} /></div>
        <div><label className="lbl" htmlFor="ot">Unpaid OT hours</label><input id="ot" type="number" min={0} className="field" value={otHours} onChange={e => { setOtHours(Number(e.target.value)); }} /></div>
        <div><label className="lbl" htmlFor="hr">Hourly rate ($)</label><input id="hr" type="number" min={0} className="field" value={rate} onChange={e => { setRate(Number(e.target.value)); }} /></div>
        <div><label className="lbl" htmlFor="lp">Final pay late (days)</label><input id="lp" type="number" min={0} className="field" value={lateDays} onChange={e => { setLateDays(Number(e.target.value)); }} /></div>
        <div><label className="lbl" htmlFor="dr">Daily wage ($, CA § 203)</label><input id="dr" type="number" min={0} className="field" value={dailyRate} onChange={e => { setDailyRate(Number(e.target.value)); }} /></div>
      </div>

      <PopVerdict className="rounded-2xl border border-[rgba(89,213,240,0.35)] bg-[rgba(89,213,240,0.05)] p-4" ariaLive="polite">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">FLSA EXPOSURE — 29 U.S.C. §§ 216(b) · 255(a) · 260</div>
        <div className="flex flex-wrap items-end gap-4 mt-2">
          <div><div className="mono text-[8px] text-[var(--dim)]">BACK WAGES</div><div className="font-display text-xl text-[var(--ink)]">{money(verdict.flsaBackWages)}</div></div>
          <div><div className="mono text-[8px] text-[var(--dim)]">LIQUIDATED (=100%)</div><div className="font-display text-xl text-[var(--ink)]">{money(verdict.flsaLiquidated)}</div></div>
          <div><div className="mono text-[8px] text-[var(--dim)]">FEDERAL TOTAL</div><div className="font-display text-xl text-[var(--gold)]">{money(verdict.flsaTotal)}</div></div>
          {verdict.statePenalty > 0 && <div><div className="mono text-[8px] text-[var(--dim)]">STATE ON TOP</div><div className="font-display text-xl text-[var(--gold)]">+{money(verdict.statePenalty)}</div></div>}
        </div>
        <p className="text-[11px] text-[#c9cddb] mt-3 leading-relaxed">{verdict.stateRule}</p>
        <p className="text-[10px] text-[var(--dim)] mt-1 leading-relaxed">{verdict.note}</p>
        {entry?.url
          ? <a href={entry.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mono text-[9px] text-[var(--cyan)] hover:underline mt-2"><ExternalLink size={10} />File free — agency retrieved 2026-11-26</a>
          : <span className="mono text-[8px] text-[var(--dim)] mt-2 block">Agency link withheld — not fetch-verified from build network 2026-11-26. Search the WHD / state labour office directly.</span>}
      </PopVerdict>
      <p className="mono text-[8px] text-[var(--dim)]">OT math: FLSA 1.5× — the premium half is computed on your hourly rate × OT hours above; straight-time OT may be inside “wages owed.” 2-year SOL, 3 if willful. You never pay to file an official claim. Not legal advice; retaliation for asserting FLSA rights is itself unlawful (§ 215(a)(3)).</p>
    </section>
  );
}
