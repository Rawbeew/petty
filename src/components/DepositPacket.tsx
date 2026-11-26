/* Tenant deposit packet — deterministic statutory clock + exposure math + demand letter.
 * US launch ring only. Information, not legal advice. */
import { useState } from 'react';
import { Home, ExternalLink, FileText, ShieldCheck, Printer, AlarmClock, Check } from 'lucide-react';
import { DEPOSIT_STATUTES } from '../data/packets';
import { computeDeposit, depositLetter, type DepositState } from '../lib/packets';
import { SectionHeader } from './ui/SectionHeader';
import { PopVerdict } from './ui/Motion';
import { cx, downloadText } from '../lib/ui';
import { printDocument } from '../lib/print';
import { addReminder, loadReminders } from '../lib/reminders';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function DepositPacket() {
  const [state, setState] = useState<DepositState>('NY');
  const [deposit, setDeposit] = useState(2000);
  const [withheld, setWithheld] = useState(2000);
  const [vacatedOn, setVacatedOn] = useState('2026-10-01');
  const [fwd, setFwd] = useState(true);
  const [watched, setWatched] = useState(false);
  const [landlord, setLandlord] = useState(''); const [prop, setProp] = useState(''); const [you, setYou] = useState(''); const [yaddr, setYaddr] = useState('');
  const statute = DEPOSIT_STATUTES.find(d => d.state === state);
  if (!statute) return null; /* unreachable — select is driven by DEPOSIT_STATUTES */
  const verdict = computeDeposit({ state, depositUsd: deposit, withheldUsd: withheld, vacatedOn, forwardingAddressGiven: fwd });

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Home} kicker="Tenant deposit — US" title="The 14 · 21 · 30 · 45-day clocks" right={<span className="chip chip-gold"><ShieldCheck size={10} />NO LAWYER NEEDED FOR THE MATH</span>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div><label className="lbl" htmlFor="ds">State</label>
          <select id="ds" className="field" value={state} onChange={e => { const next = DEPOSIT_STATUTES.find(d => d.state === e.target.value); if (next) setState(next.state); }}>{DEPOSIT_STATUTES.map(d => <option key={d.state} value={d.state}>{d.state}</option>)}</select></div>
        <div><label className="lbl" htmlFor="dep">Deposit ($)</label><input id="dep" type="number" min={0} className="field" value={deposit} onChange={e => { setDeposit(Number(e.target.value)); }} /></div>
        <div><label className="lbl" htmlFor="wth">They kept ($)</label><input id="wth" type="number" min={0} className="field" value={withheld} onChange={e => { setWithheld(Number(e.target.value)); }} /></div>
        <div><label className="lbl" htmlFor="vac">Vacated on</label><input id="vac" type="date" className="field" value={vacatedOn} onChange={e => { setVacatedOn(e.target.value); }} /></div>
        {state === 'TX' && <div className="col-span-2 md:col-span-4"><label className="flex items-center gap-2 text-[11px] text-[var(--dim)]"><input type="checkbox" checked={fwd} onChange={e => { setFwd(e.target.checked); }} className="accent-[#F2C14E] h-4 w-4" />I gave a written forwarding address (the TX 30-day clock only runs after this)</label></div>}
      </div>

      <PopVerdict className={cx('rounded-2xl border p-4', verdict.overdue ? 'border-[rgba(242,193,78,0.4)] bg-[rgba(242,193,78,0.06)]' : 'border-[var(--line2)]')} ariaLive="polite">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">STATUTORY VERDICT · {statute.law}</div>
        <div className="flex flex-wrap items-end gap-4 mt-2">
          <div><div className="mono text-[8px] text-[var(--dim)]">DEADLINE</div><div className="font-display text-xl text-[var(--ink)]">{verdict.deadline.split(' —')[0] ?? verdict.deadline}</div></div>
          <div><div className="mono text-[8px] text-[var(--dim)]">DAYS LATE</div><div className={cx('font-display text-xl', verdict.overdue ? 'text-[var(--gold)]' : 'text-[var(--ink)]')}>{verdict.overdue ? verdict.daysLate : '—'}</div></div>
          <div><div className="mono text-[8px] text-[var(--dim)]">THEY OWE (MIN)</div><div className="font-display text-xl text-[var(--ink)]">{money(verdict.exposureMin)}</div></div>
          <div><div className="mono text-[8px] text-[var(--dim)]">STATUTE CAP (MAX)</div><div className="font-display text-xl text-[var(--gold)]">{money(verdict.exposureMax)}</div></div>
        </div>
        <p className="text-[11px] text-[#c9cddb] mt-3 leading-relaxed">{verdict.penaltyRule}</p>
        <p className="text-[10px] text-[var(--dim)] mt-1.5 leading-relaxed">{verdict.actionNote} {statute.premiseNote}</p>
        {statute.url
          ? <a href={statute.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mono text-[9px] text-[var(--cyan)] hover:underline mt-2"><ExternalLink size={10} />Primary source — verified {statute.verifiedAt}</a>
          : <span className="mono text-[8px] text-[var(--dim)] mt-2 block">Official statute page unreachable from build network {statute.verifiedAt} — search the citation above ({statute.law.split('(')[0]?.trim() ?? statute.law}) on ilga.gov / statutes.capitol.texas.gov</span>}
      </PopVerdict>

      <div className="grid grid-cols-2 gap-2.5">
        <input className="field" placeholder="Landlord / mgmt co." value={landlord} onChange={e => { setLandlord(e.target.value); }} aria-label="Landlord name" />
        <input className="field" placeholder="Property address" value={prop} onChange={e => { setProp(e.target.value); }} aria-label="Property address" />
        <input className="field" placeholder="Your name" value={you} onChange={e => { setYou(e.target.value); }} aria-label="Your name" />
        <input className="field" placeholder="Your mailing address" value={yaddr} onChange={e => { setYaddr(e.target.value); }} aria-label="Your address" />
      </div>
      <div className="flex gap-2">
        <button disabled={!landlord.trim() || !you.trim()}
          onClick={() => { downloadText('petty-deposit-demand-letter.txt', depositLetter({ state, depositUsd: deposit, withheldUsd: withheld, vacatedOn, forwardingAddressGiven: fwd, landlordName: landlord.trim(), propertyAddress: prop.trim() || 'the premises', yourName: you.trim(), yourAddress: yaddr.trim() || '(your address)' })); }}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold py-3 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)] disabled:opacity-40 disabled:cursor-not-allowed"><FileText size={14} />Generate demand letter (.txt)</button>
        <button onClick={() => { printDocument('Petty — Deposit Demand Letter', depositLetter({ state, depositUsd: deposit, withheldUsd: withheld, vacatedOn, forwardingAddressGiven: fwd, landlordName: landlord.trim() || '(landlord)', propertyAddress: prop.trim() || 'the premises', yourName: you.trim() || '(you)', yourAddress: yaddr.trim() || '(your address)' })); }} aria-label="Print or save as PDF" title="Print / save as PDF" className="w-12 flex items-center justify-center rounded-xl border border-[var(--line2)] text-[var(--dim)] hover:text-[var(--ink)] hover:border-[var(--gold)]"><Printer size={16} /></button>
      </div>
      <button onClick={() => { const due = verdict.deadline.split(' —')[0]?.trim() ?? ''; if (!due) return; const already = loadReminders().some(r => r.source === 'deposit' && r.dueAt === due && !r.done); if (!already) addReminder(`Deposit — ${statute.law.split('(')[0]?.trim() ?? statute.law} statutory deadline (${state})`, due, 'deposit'); setWatched(true); }} disabled={watched} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--line2)] text-[var(--cyan)] py-2.5 mono text-[9px] tracking-[0.2em] uppercase hover:border-[var(--cyan)] disabled:opacity-70">{watched ? <><Check size={13} />Watching — on the Clockwatch</> : <><AlarmClock size={13} />Watch this deadline on-device</>}</button>
      <p className="mono text-[8px] text-[var(--dim)]">Demand valid for US residential tenants only. Information, not legal advice — statutes simplified for triage; verify current text + local court rules (small-claims limits differ). Petty is not your lawyer.</p>
    </section>
  );
}
