/* When the label lies — food fraud evidence card. Checklist + honest remedies map.
 * Not legal advice; no private right of action under the FDCA exists. */
import { Milk, Camera, ClipboardCheck, Stethoscope, Landmark } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';

const STEPS = [
  { icon: Camera, text: 'Photograph the front AND ingredient/nutrition panels — both hands flat on the counter. Screenshot the shelf tag if you still have it.' },
  { icon: ClipboardCheck, text: 'Capture lot/batch code, best-by date, UPC, store and purchase date. Save the receipt and the packaging — do not bin it.' },
  { icon: Stethoscope, text: 'Sick? Doctor first, report second. Bring the product. Ask for the foodborne panel if stomach trouble is involved.' },
  { icon: Landmark, text: 'Not sick but the pattern’s there (watered milk, phantom “organic”, short weight)? That’s a consumer-protection pattern — state AG + class counsel want it documented.' },
];

export default function FoodFraudCard() {
  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Milk} kicker="Food fraud — US" title="When the label lies, the receipt is the case." right={<span className="chip chip-cyan">EVIDENCE FIRST</span>} />
      <ol className="space-y-2.5">{STEPS.map((s, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[11px] text-[#c9cddb]"><span className="mono text-[9px] text-[var(--gold)] mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span><s.icon size={13} className="text-[var(--cyan)] mt-0.5 shrink-0" aria-hidden />{s.text}</li>
      ))}</ol>
      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">WHERE THE CLAIM ACTUALLY LIVES</div>
        <p className="text-[11px] text-[#c9cddb] leading-relaxed"><span className="text-[var(--ink)]">The FDCA gives no private right of action</span> — you cannot sue “because it’s fake” under federal law alone. Your remedies are: <span className="text-[var(--ink)]">(1)</span> state consumer-protection statutes (NY GBL §§ 349/350 · CA CLRA/UCL/FAL · WA CPA and siblings), <span className="text-[var(--ink)]">(2)</span> contract/tort (fraud, negligence), and <span className="text-[var(--ink)]">(3)</span> class actions — where one label defect can serve thousands of buyers at once. Class counsel take food cases on contingency; bring them this file, not a story.</p>
        <p className="text-[11px] text-[#c9cddb] leading-relaxed"><span className="text-[var(--ink)]">Report anyway:</span> FDA Safety Reporting Portal (<span className="text-[var(--ink)]">report.fda.gov</span>) — <span className="text-[var(--dim)]">refused connection from the build network on 2026-11-26 (000), so no proxy-faith link; it works in your browser.</span> NY AG Consumer Fraud Bureau complaint <span className="text-[var(--dim)]">(ag.ny.gov)</span> and your state AG’s consumer division take affidavits. FSIS (meat/poultry mislabeling): fsis.usda.gov.</p>
        <p className="text-[11px] text-[#c9cddb] leading-relaxed"><span className="text-[var(--ink)]">Find who already filed:</span> search CourtListener for the product or maker (e.g. “milk mislabeled”) — the docket tells you whether counsel is already moving, what the theory is, and whether you’d be a class member.</p>
      </div>
      <p className="mono text-[8px] text-[var(--dim)]">Petty cannot file for you and cannot guarantee a theory survives. Petty holds your evidence together so the first call with counsel or the AG is boring — in the best way. Not legal advice; no agency relationship.</p>
    </section>
  );
}
