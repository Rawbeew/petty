/* US consumer settlement watchlist — every entry fetch-verified before it ships.
 * An entry that lapses renders EXPIRED, never claimable (P3). */
import { BadgeDollarSign, ExternalLink, Timer, ShieldCheck } from 'lucide-react';
import { SETTLEMENTS } from '../data/packets';
import { daysUntil, settlementStatus } from '../lib/packets';
import { SectionHeader } from './ui/SectionHeader';
import { cx } from '../lib/ui';

export default function SettlementWatchlist() {
  return (
    <section className="panel p-5 space-y-4 xl:col-span-2">
      <SectionHeader icon={BadgeDollarSign} kicker="US settlement watchlist" title="Claims you may be owed — filed free or not at all"
        right={<span className="chip chip-gold"><ShieldCheck size={10} />FETCH-VERIFIED · NEVER A % FEE</span>} />
      <div className="grid md:grid-cols-2 gap-4">
        {SETTLEMENTS.map(s => {
          const status = settlementStatus(s);
          const days = daysUntil(s.deadline);
          const open = status === 'open';
          return (
            <article key={s.id} className={cx('rounded-2xl border p-4 flex flex-col', open ? 'border-[rgba(242,193,78,0.4)]' : 'border-[var(--line2)] opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="mono text-[8px] tracking-[0.25em] text-[var(--gold)]">{s.category.toUpperCase()} · {s.defendant.toUpperCase()}</div>
                  <h3 className="font-display text-[15px] mt-1 leading-snug">{s.title}</h3>
                  <div className="mono text-[8px] text-[var(--dim)] mt-1">{s.caseNo} · {s.court} · Fund {s.amount}</div>
                </div>
                <span className={cx('chip shrink-0', open ? 'chip-gold' : '')}>{open ? <><Timer size={10} />{days}D LEFT</> : 'EXPIRED'}</span>
              </div>
              <p className="mono text-[9px] text-[#e6c87a] mt-2">{s.perPerson}{open ? ` · deadline ${s.deadline}` : ' · deadline passed'}</p>
              <ul className="mt-2 space-y-1 text-[11px] text-[#c9cddb]">
                {s.eligibility.map(e => <li key={e} className="flex items-start gap-1.5"><span aria-hidden className="text-[var(--gold)]">▸</span>{e}</li>)}
              </ul>
              <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                <a href={s.claimUrl} target="_blank" rel="noreferrer" className={cx('inline-flex items-center gap-1.5 rounded-xl px-4 py-2 mono text-[9px] tracking-[0.18em] uppercase', open ? 'bg-[var(--gold)] text-black font-bold hover:bg-[var(--gold2)]' : 'border border-[var(--line2)] text-[var(--dim)] pointer-events-none')} aria-disabled={!open}><ExternalLink size={11} />{open ? 'Official claim portal' : 'Claim window closed'}</a>
                <span className="mono text-[8px] text-[var(--dim)] text-right">verified {s.verifiedAt}<br />{s.amount}</span>
              </div>
              <p className="mono text-[7.5px] text-[var(--dim)] mt-2 leading-relaxed">{s.sourceNote}</p>
            </article>
          );
        })}
        {/* honest placeholder slot — registry ships empty or verified, never guessed */}
        <div className="rounded-2xl border border-dashed border-[var(--line2)] p-4 flex flex-col items-center justify-center text-center gap-2">
          <BadgeDollarSign size={20} className="text-[var(--dim)]" aria-hidden />
          <p className="mono text-[9px] text-[var(--dim)] leading-relaxed">Next entries land only after the same<br />fetch-verified audit (reports/settlements-audit-*.md).<br />No deadline = no listing. No exceptions.</p>
        </div>
      </div>
      <p className="mono text-[8px] text-[var(--dim)]">Petty never files claims for you, never charges per claim, never picks a side. The portal is the settlement administrator’s — not Apple’s, not a claims agency’s. Filing is free; anyone charging upfront is stealing. Information, not legal advice; Petty is not affiliated with any settlement administrator or court.</p>
    </section>
  );
}
