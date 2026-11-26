/* When the label lies — food fraud evidence card + complaint packet generator.
 * Checklist + honest remedies map + deterministic filing text. Not legal advice; FDCA has no private right of action. */
import { useState } from 'react';
import { Milk, Camera, ClipboardCheck, Stethoscope, Landmark, FileText, ShieldCheck } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';
import PhotoEvidence from './PhotoEvidence';
import { downloadText } from '../lib/ui';

const STEPS = [
  { icon: Camera, text: 'Photograph the front AND ingredient/nutrition panels — both hands flat on the counter. Screenshot the shelf tag if you still have it.' },
  { icon: ClipboardCheck, text: 'Capture lot/batch code, best-by date, UPC, store and purchase date. Save the receipt and the packaging — do not bin it.' },
  { icon: Stethoscope, text: 'Sick? Doctor first, report second. Bring the product. Ask for the foodborne panel if stomach trouble is involved.' },
  { icon: Landmark, text: 'Not sick but the pattern’s there (watered milk, phantom “organic”, short weight)? That’s a consumer-protection pattern — state AG + class counsel want it documented.' },
];

const RECIPIENTS = [
  'County / city health department — food-service complaint (US)',
  'State attorney general — consumer protection division (US)',
  'FDA — Consumer Complaint Coordinator (Report a Problem, fda.gov)',
  'USDA FSIS — meat & poultry mislabeling (fsis.usda.gov)',
  'Federal Trade Commission — ReportFraud.ftc.gov',
];

export default function FoodFraudCard() {
  const [product, setProduct] = useState(''); const [business, setBusiness] = useState(''); const [date, setDate] = useState(''); const [what, setWhat] = useState(''); const [ill, setIll] = useState(false); const [recipient, setRecipient] = useState<string>(RECIPIENTS[0] ?? '');

  const generate = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadText('petty-food-fraud-complaint.txt', [
      'PETTY — FOOD FRAUD COMPLAINT (generated on this device; facts are yours)',
      `Generated: ${today}`,
      '',
      `TO: ${recipient}`,
      '',
      'RE: Suspected mislabeled / adulterated / falsely marketed food product',
      '',
      `Product: ${product.trim() || '(fill in)'}`,
      `Seller / maker: ${business.trim() || '(fill in)'}`,
      `Date of purchase: ${date.trim() || '(fill in)'}`,
      '',
      'WHAT HAPPENED',
      what.trim() || '(describe the label vs the product: ingredients, weight, “organic”/“raw” claims, allergen statements, taste/appearance vs the disclosure…)',
      '',
      `Illness involved: ${ill ? 'YES — I sought/attended medical care' : 'No illness reported by me'}`,
      '',
      'EVIDENCE (stored on my device; copies enclosed/attached)',
      ' - Photographs: front label, ingredient panel, lot/batch code, best-by, shelf tag, receipt, packaging',
      ' - Receipt and packaging retained — available on request',
      ' - Any medical documentation if illness occurred',
      '',
      'WHAT I ASK OF YOU',
      ' - Open an inquiry into the product and seller named above',
      ' - Verify the label claims against retained samples',
      ' - Confirm receipt of this complaint and the reference number',
      '',
      'I make this complaint truthfully and in good faith. I am not an attorney; this is not legal advice.',
      'I understand agencies act on their own authority; this filing does not guarantee investigation or outcome.',
      '',
      '(Your name, address, phone, email — fill in before sending)',
    ].join('\n'));
  };

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Milk} kicker="Food fraud — US" title="When the label lies, the receipt is the case." right={<span className="chip chip-cyan">EVIDENCE FIRST</span>} />
      <ol className="space-y-2.5">{STEPS.map((s, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[11px] text-[#c9cddb]"><span className="mono text-[9px] text-[var(--gold)] mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span><s.icon size={13} className="text-[var(--cyan)] mt-0.5 shrink-0" aria-hidden />{s.text}</li>
      ))}</ol>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><ShieldCheck size={10} className="text-[var(--green)]" />EVIDENCE — ATTACH NOW, IT NEVER LEAVES THIS PHONE</div>
        <PhotoEvidence scope="foodfraud" />
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2.5">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><FileText size={10} />BUILD THE COMPLAINT PACKET</div>
        <div className="grid grid-cols-2 gap-2.5">
          <input className="field col-span-2" placeholder="Product (e.g. 2% reduced fat milk)" value={product} onChange={e => { setProduct(e.target.value); }} aria-label="Product" />
          <input className="field col-span-2" placeholder="Seller / maker (store or brand)" value={business} onChange={e => { setBusiness(e.target.value); }} aria-label="Seller or maker" />
          <input className="field" type="date" value={date} onChange={e => { setDate(e.target.value); }} aria-label="Purchase date" />
          <select className="field" value={recipient} onChange={e => { setRecipient(e.target.value); }} aria-label="Who receives this">{RECIPIENTS.map(r => <option key={r} value={r}>{r}</option>)}</select>
          <textarea className="field col-span-2 min-h-[72px]" placeholder="What the label promised vs what the product was (ingredients, net weight, organic/raw claim, allergen, quality…)" value={what} onChange={e => { setWhat(e.target.value); }} aria-label="What happened" />
          <label className="col-span-2 flex items-center gap-2 text-[11px] text-[var(--dim)]"><input type="checkbox" checked={ill} onChange={e => { setIll(e.target.checked); }} className="accent-[#F2C14E] h-4 w-4" />Someone was made ill — keep medical records and any retained sample</label>
        </div>
        <button onClick={generate} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[rgba(242,193,78,0.1)]"><FileText size={13} />Generate complaint packet (.txt)</button>
        <p className="mono text-[8px] text-[var(--dim)]">Recipient names are factual; Petty does not fetch agency intake portals from this build network — find your state AG / health department via their official .gov page, and attach your photos to whatever channel you use.</p>
      </div>

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
