/* The Complaint Desk — guided OFFICIAL complaints for restaurants & services.
 * Evidence photos stay on this device (IndexedDB). Petty never files for you, never
 * posts publicly, never rates or shames — you write, you send, agencies decide. */
import { useState } from 'react';
import { Landmark, Camera, FileText, ShieldCheck, ExternalLink, TriangleAlert } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';
import PhotoEvidence from './PhotoEvidence';
import { downloadText } from '../lib/ui';

type LaneId = 'food_illness' | 'food_packaged' | 'contractor' | 'product_hazard' | 'telecom' | 'auto_repair' | 'debt' | 'wages' | 'other';

interface Lane {
  id: LaneId; label: string;
  who: string; how: string; portal: string;
  note: string;
}

const LANES: Lane[] = [
  { id: 'food_illness', label: 'Restaurant / food made me sick',
    who: 'Your county or city health department — foodborne illness complaint',
    how: 'Call or web form; most have a food-poisoning line. They inspect restaurants on their own authority — you never pay.',
    portal: 'search “<your county> health department foodborne complaint” — official .gov sites only',
    note: 'If packaged/retail food caused it, use the FDA lane instead. Meat/poultry/egg processing issues go to USDA FSIS (fsis.usda.gov).' },
  { id: 'food_packaged', label: 'Packaged / retail food product problem',
    who: 'FDA Safety Reporting Portal',
    how: 'Web form. The FDA triages; your report can trigger sampling, inspection or recall even if no one else files.',
    portal: 'report.fda.gov — refused connection from the build network on 2026-11-26 (000); it loads in your browser',
    note: 'FSIS handles meat, poultry and processed egg products instead (fsis.usda.gov). Keep packaging + lot code — that is the traceability key.' },
  { id: 'contractor', label: 'Contractor / home services — took money, did poor or no work',
    who: 'State attorney general consumer protection division + state contractor licensing board (licensed trades)',
    how: 'AG consumer complaint form (every state has one); licensing board can suspend/revoke — far faster than court for licensed trades.',
    portal: 'ag.<yourstate>.gov → consumer protection / complaint; find the licensing board via your state’s official .gov portal',
    note: 'FTC takes reports at ReportFraud.ftc.gov (useful data, limited individual remedy). For your money back: demand letter → small claims. Petty’s deposit/wage engines cover those lanes too.' },
  { id: 'product_hazard', label: 'Product (non-food) hurt or could hurt someone',
    who: 'U.S. Consumer Product Safety Commission',
    how: 'SaferProducts.gov web form. CPSC can press recalls; injuries are required-ish to report — patterns move them.',
    portal: 'saferproducts.gov',
    note: 'State AG and class counsel handle the “defective design” money side. Report here first — it creates the record.' },
  { id: 'telecom', label: 'Phone / internet / cable billing or service abuse',
    who: 'FCC informal complaint (free) + your state utility commission for the utility side',
    how: 'FCC web form; companies must respond in writing, usually within 30 days — that alone fixes most billing fights.',
    portal: 'fcc.gov → consumers → file a complaint',
    note: 'Cramming and slamming are enforcement priorities. Keep bills and chat logs as evidence.' },
  { id: 'auto_repair', label: 'Auto shop — overcharge, phantom repairs, unsafe work',
    who: 'State attorney general + your state’s auto-repair regulator (e.g. CA Bureau of Automotive Repair)',
    how: 'Many states license auto shops with fee schedules and estimate rules; the board can order restitution.',
    portal: 'search “<your state> auto repair complaint” on the official .gov portal',
    note: 'Over-$ threshold and safety issues → AG. Straight refund fight → demand letter; small claims ends it.' },
  { id: 'debt', label: 'Debt collector harassment / wrong debt',
    who: 'Consumer Financial Protection Bureau + state attorney general',
    how: 'CFPB complaint; the company has 15 days to respond. Documented FDCPA violations (15 U.S.C. § 1692) belong in your file.',
    portal: 'consumerfinance.gov/complaint',
    note: 'You may dispute in writing within 30 days of first contact — the collector must stop until verified. Petty is not affiliated with CFPB.' },
  { id: 'wages', label: 'Unpaid wages / final paycheck withheld',
    who: 'U.S. DOL Wage & Hour Division — or your state labor agency',
    how: 'DOL intake form; FLSA gives 2–3 years to file, liquidated damages double it. NYLL/CA codes add more.',
    portal: 'dol.gov/agencies/whd — and see Petty’s unpaid-wage engine in this same view for the damages math',
    note: 'This lane is the WagePacket’s home turf — use the engine first, then file with the numbers in hand.' },
  { id: 'other', label: 'Something else a business did to me',
    who: 'State attorney general consumer division + FTC',
    how: 'Both take general consumer fraud reports; AG investigations aggregate across thousands of victims.',
    portal: 'ag.<yourstate>.gov and ReportFraud.ftc.gov',
    note: 'If it involves a licensed profession (doctor, lawyer, realtor, broker), the licensing board is the sharper knife — find it via the state .gov portal.' },
];

export default function ComplaintDesk() {
  const [lane, setLane] = useState<LaneId>('food_illness');
  const [business, setBusiness] = useState(''); const [date, setDate] = useState(''); const [what, setWhat] = useState(''); const [ill, setIll] = useState(false);
  const isLaneId = (v: string): v is LaneId => LANES.some(l => l.id === v);
  const first = LANES[0];
  if (first === undefined) return null; // static table — unreachable
  const active = LANES.find(l => l.id === lane) ?? first;

  const generate = () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadText('petty-official-complaint.txt', [
      'PETTY — OFFICIAL COMPLAINT (generated on this device; facts are yours)',
      `Generated: ${today}`,
      '',
      `TO: ${active.who}`,
      `CHANNEL: ${active.portal}`,
      '',
      'RE: Consumer complaint — official regulator intake',
      '',
      `Business / establishment: ${business.trim() || '(fill in)'}`,
      `Date(s) of incident: ${date.trim() || '(fill in)'}`,
      '',
      'WHAT HAPPENED',
      what.trim() || '(describe what was promised vs what happened — receipts, statements, names, amounts…)',
      '',
      `Illness or injury involved: ${ill ? 'YES — medical care sought/attended; records retained' : 'No illness or injury reported by me'}`,
      '',
      'EVIDENCE (held on my device; copies available to you)',
      ' - Photographs taken at the scene / of the product or work: front, labels, lot codes, receipts, the condition itself',
      ' - Original receipt and any packaging, paperwork, contract, or communication retained',
      ' - Any medical documentation where illness or injury occurred',
      '',
      'WHAT I ASK OF YOU',
      ' - Open an inquiry and confirm receipt with a reference number',
      ` - Apply your authority: inspection, mediation, or enforcement as your mandate allows`,
      ' - Notify me in writing of the outcome',
      '',
      'I make this complaint truthfully and in good faith. I understand no outcome is guaranteed and that',
      'this filing is not legal advice, does not create an attorney–client relationship, and does not limit',
      'any parallel rights or remedies I may have.',
      '',
      '(Your name, address, phone, email and signature — fill in before sending)',
    ].join('\n'));
  };

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Landmark} kicker="Complaint desk — US" title="Report it to whoever can actually punish them." right={<span className="chip chip-cyan">NO PUBLIC SHAMING — EVER</span>} />
      <p className="text-[11px] text-[#c9cddb] leading-relaxed">Petty does not post reviews, run ratings, or name-and-shame businesses — that helps no one and can backfire on you. What moves the needle: an official complaint with dated evidence to the regulator that actually has teeth. Pick the lane:</p>
      <div>
        <label className="lbl" htmlFor="lane">What happened?</label>
        <select id="lane" className="field" value={lane} onChange={e => { setLane(isLaneId(e.target.value) ? e.target.value : 'other'); }}>{LANES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
      </div>
      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><Landmark size={10} className="text-[var(--gold)]" />WHERE THIS GOES</div>
        <p className="text-[12px] text-[var(--ink)]">{active.who}</p>
        <p className="text-[11px] text-[#c9cddb]">{active.how}</p>
        <p className="text-[10px] mono text-[var(--cyan)] break-words">{active.portal}</p>
        <p className="text-[10px] text-[var(--dim)] leading-relaxed"><TriangleAlert size={10} className="inline text-[var(--gold)] mr-1" />{active.note}</p>
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><Camera size={10} className="text-[var(--cyan)]" />EVIDENCE — STAYS ON THIS DEVICE</div>
        <PhotoEvidence scope="complaint" />
      </div>

      <div className="rounded-2xl border border-[var(--line2)] p-4 space-y-2.5">
        <div className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><FileText size={10} />BUILD THE COMPLAINT LETTER</div>
        <div className="grid grid-cols-2 gap-2.5">
          <input className="field col-span-2" placeholder="Business / establishment (name as it appeared)" value={business} onChange={e => { setBusiness(e.target.value); }} aria-label="Business name" />
          <input className="field" type="date" value={date} onChange={e => { setDate(e.target.value); }} aria-label="Date of incident" />
          <label className="flex items-center gap-2 text-[11px] text-[var(--dim)]"><input type="checkbox" checked={ill} onChange={e => { setIll(e.target.checked); }} className="accent-[#F2C14E] h-4 w-4" />Someone was made ill or hurt</label>
          <textarea className="field col-span-2 min-h-[72px]" placeholder="What was promised vs what happened — receipts, names, amounts, dates…" value={what} onChange={e => { setWhat(e.target.value); }} aria-label="What happened" />
        </div>
        <button onClick={generate} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[rgba(242,193,78,0.1)]"><FileText size={13} />Generate complaint letter (.txt)</button>
      </div>
      <div className="flex items-start gap-2 text-[9px] mono text-[var(--dim)]"><ShieldCheck size={11} className="text-[var(--green)] mt-0.5 shrink-0" /><span>Petty never files anything and never contacts anyone for you — you send. UK readers: Citizens Advice consumer service + your local Trading Standards office, and the FSA for food. Information, not legal advice. No regulator guarantees outcome; many do investigate.</span></div>
      <p className="mono text-[8px] text-[var(--dim)] flex items-center gap-1">External portals open at the addresses shown — Petty does not proxy or vouch for their live availability. <ExternalLink size={9} /></p>
    </section>
  );
}
