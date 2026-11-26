/* Tariff docket watch — IEEPA refunds are for importers of record only. Consumers have no claim.
 * All facts fetch-verified 2026-11-26 (see sources). Not customs advice. */
import { Scale, ExternalLink, ShieldCheck } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

const SOURCES = [
  { name: 'Learning Resources, Inc. v. Trump (Wikipedia — decision summary)', url: 'https://en.wikipedia.org/wiki/Learning_Resources,_Inc._v._Trump' },
  { name: 'IEEPA refunds: liquidation, protests and CAPE (Mondaq — trade practice note)', url: 'https://www.mondaq.com/unitedstates/international-trade-investment/1847066/after-learning-resources-liquidation-protests-and-ieepa-tariff-refunds' },
  { name: 'IEEPA tariff refunds 2026: CAPE, deadlines, eligibility (CVDAR — counsel note)', url: 'https://cvdar.com/learn/ieepa-tariff-refunds' },
];

export default function TariffWatch() {
  return (
    <section className="panel p-5 space-y-3">
      <SectionHeader icon={Scale} kicker="Docket watch — IEEPA tariff refunds" title="The refunds are importers’ money. Yours only if you imported." right={<span className="chip chip-cyan"><ShieldCheck size={10} />INFORMATION, NOT CUSTOMS ADVICE</span>} />
      <div className="grid md:grid-cols-2 gap-4 text-[11px] text-[#c9cddb] leading-relaxed">
        <ul className="space-y-1.5">
          <li><span className="mono text-[9px] text-[var(--gold)]">FEB 20 2026 · SCOTUS 6-3</span><br />IEEPA does not authorize tariffs — <em>Learning Resources v. Trump</em> (consolidated with <em>V.O.S. Selections</em>). Court of International Trade holds exclusive jurisdiction.</li>
          <li><span className="mono text-[9px] text-[var(--gold)]">MAR 4 2026 · CIT NATIONWIDE ORDER</span><br />Judge Eaton ruled all importers who paid IEEPA duties — plus interest — are owed refunds, not only the plaintiff companies.</li>
          <li><span className="mono text-[9px] text-[var(--gold)]">APR 20 2026 · CAPE PHASE 1 LIVE</span><br />CBP opened the ACE-portal refund system — CAPE declaration (CSV ≤ 9,999 entries), IEEPA lines removed, ~60–90 days to payment. Phase 3 from Oct 6 2026 covers CIT-reliquidation orders.</li>
        </ul>
        <ul className="space-y-1.5">
          <li><span className="mono text-[9px] text-[var(--ink)]">WHO GETS PAID</span><br />Importer of record (or their filing customs broker). Only IEEPA Chapter 99 duties — not §301/§232/§122. Consumers, DDP buyers and retail shoppers: <span className="text-[var(--gold)]">no claim exists. Anyone selling you one is committing fraud.</span></li>
          <li><span className="mono text-[9px] text-[var(--ink)]">THE CLOCKS</span><br />Unliquidated + within 80 days of liquidation → CAPE. 180-day protest per entry (jurisdictional). Final-liquidated entries → CIT suit by end of January 2027. Interest runs (19 CFR § 24.36). ACH enrolment is mandatory — ~$1.3B reported on hold for missing banking details (Sep 2026).</li>
          <li><span className="mono text-[9px] text-[var(--ink)]">$81B PAID BY JULY 2026</span><br />If you are an importer: call your broker, pull entry summaries (CBP 7501), enroll ACH, file. If you bought a product and think “Trump owes me” — that’s not how this works; the store got the discount or the government did.</li>
        </ul>
      </div>
      <div className="border-t border-[var(--line)] pt-3">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] mb-1.5">SOURCES — RETRIEVED 2026-11-26</div>
        <ul className="space-y-1">{SOURCES.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mono text-[9px] text-[var(--cyan)] hover:underline"><ExternalLink size={10} />{s.name}</a></li>)}</ul>
      </div>
      <p className="mono text-[8px] text-[var(--dim)]">Petty is not your customs broker, freight forwarder or trade counsel. If CAPE-eligible entries apply to you, the cheapest conversation you will ever have is the one with your broker today.</p>
    </section>
  );
}
