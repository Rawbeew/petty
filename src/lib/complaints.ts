/* Petty — complaint desk engines. DETERMINISTIC ONLY: lanes, routing rules, letters.
 * "Smart mapping" before AI: weighted keyword/phrase scoring (expert-system style,
 * like the if-then trees in phone IVRs and rules engines) — every match is shown,
 * every decision is traceable to a phrase in the user's own words. No LLM in the loop.
 * Citation or silence: portals named here are factual; nothing is fetched or vouched for. */

export type LaneId = 'food_illness' | 'food_packaged' | 'contractor' | 'product_hazard' | 'telecom' | 'auto_repair' | 'debt' | 'wages' | 'other';

export interface Lane {
  id: LaneId; label: string;
  who: string; how: string; portal: string; note: string;
}

export const LANES: Lane[] = [
  { id: 'food_illness', label: 'Restaurant / food made me sick',
    who: 'Your county or city health department — foodborne illness complaint',
    how: 'Call or web form; most have a food-poisoning line. They inspect restaurants on their own authority — you never pay.',
    portal: 'search “<your county> health department foodborne complaint” — official .gov sites only',
    note: 'If packaged/retail food caused it, use the packaged-food lane instead. Meat/poultry/egg processing issues go to USDA FSIS (fsis.usda.gov).' },
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
    how: 'CFPB complaint; the company has ~15 days to respond. Federal Fair Debt Collection Practices Act (FDCPA) bars harassment — documented violations belong in your file.',
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

/* ------------------------------------------------------------------ */
/* Deterministic router: weighted phrase rules. No model, no network.  */
/* Every matched phrase is returned so the user sees WHY it matched.   */
/* ------------------------------------------------------------------ */

interface Rule { phrase: string; weight: number }

const RULES: Record<Exclude<LaneId, 'other'>, Rule[]> = {
  food_illness: [
    { phrase: 'food poison', weight: 5 }, { phrase: 'foodborne', weight: 5 }, { phrase: 'made me sick', weight: 4 },
    { phrase: 'sick after eating', weight: 4 }, { phrase: 'got sick', weight: 3 }, { phrase: 'e coli', weight: 4 },
    { phrase: 'salmonella', weight: 4 }, { phrase: 'norovirus', weight: 4 }, { phrase: 'listeria', weight: 4 },
    { phrase: 'campylobacter', weight: 4 }, { phrase: 'anaphyl', weight: 4 }, { phrase: 'nausea', weight: 3 },
    { phrase: 'vomit', weight: 3 }, { phrase: 'diarr', weight: 3 }, { phrase: 'stomach cramp', weight: 3 },
    { phrase: 'stomach pain', weight: 2 }, { phrase: 'ate at', weight: 3 }, { phrase: 'restaurant', weight: 2 },
    { phrase: 'fast food', weight: 3 }, { phrase: 'cafe', weight: 1.5 }, { phrase: 'diner', weight: 1.5 },
    { phrase: 'kitchen', weight: 2 }, { phrase: 'undercook', weight: 3 }, { phrase: 'raw chicken', weight: 3 },
    { phrase: 'food handler', weight: 3 }, { phrase: 'allergic reaction', weight: 3 },
  ],
  food_packaged: [
    { phrase: 'lot code', weight: 4 }, { phrase: 'batch code', weight: 4 }, { phrase: 'upc', weight: 3 },
    { phrase: 'best by', weight: 2 }, { phrase: 'use by', weight: 2 }, { phrase: 'expir', weight: 1.5 },
    { phrase: 'mislabel', weight: 4 }, { phrase: 'label said', weight: 3 }, { phrase: 'ingredients list', weight: 2 },
    { phrase: 'grocery', weight: 2 }, { phrase: 'supermarket', weight: 2 }, { phrase: 'store brand', weight: 2 },
    { phrase: 'expired', weight: 2 }, { phrase: 'spoiled', weight: 2 }, { phrase: 'mold', weight: 2 },
    { phrase: 'foreign object', weight: 3 }, { phrase: 'plastic in', weight: 3 }, { phrase: 'metal in', weight: 3 },
    { phrase: 'glass in', weight: 3 }, { phrase: 'swollen can', weight: 4 }, { phrase: 'recall', weight: 2 },
    { phrase: 'organic claim', weight: 3 }, { phrase: 'short weight', weight: 3 },
  ],
  contractor: [
    { phrase: 'contractor', weight: 4 }, { phrase: 'home improvement', weight: 3 }, { phrase: 'renovat', weight: 2.5 },
    { phrase: 'remodel', weight: 2.5 }, { phrase: 'roof', weight: 2 }, { phrase: 'plumb', weight: 2 },
    { phrase: 'never finish', weight: 3 }, { phrase: 'half done', weight: 3 }, { phrase: 'unlicensed', weight: 3 },
    { phrase: 'license', weight: 2 }, { phrase: 'deposit and vanish', weight: 5 }, { phrase: 'builder', weight: 2 },
    { phrase: 'estimate', weight: 1.5 }, { phrase: 'invoice', weight: 1 }, { phrase: 'work not done', weight: 3 },
  ],
  product_hazard: [
    { phrase: 'caught fire', weight: 4 }, { phrase: 'fire', weight: 2 }, { phrase: 'explode', weight: 4 },
    { phrase: 'overheat', weight: 3 }, { phrase: 'electrocut', weight: 3 }, { phrase: 'electric shock', weight: 3 },
    { phrase: 'shocked', weight: 2 }, { phrase: 'burned', weight: 2 }, { phrase: 'sparked', weight: 2 },
    { phrase: 'defect', weight: 3 }, { phrase: 'recall', weight: 1.5 }, { phrase: 'choking', weight: 3 },
    { phrase: 'battery', weight: 1.5 }, { phrase: 'space heater', weight: 3 }, { phrase: 'appliance', weight: 1.5 },
    { phrase: 'melt', weight: 2 }, { phrase: 'lacer', weight: 2 }, { phrase: 'collapsed', weight: 2 },
  ],
  telecom: [
    { phrase: 'carrier', weight: 3 }, { phrase: 'wireless', weight: 2 }, { phrase: 'broadband', weight: 2 },
    { phrase: 'internet provider', weight: 3 }, { phrase: 'overcharg', weight: 3 }, { phrase: 'extra charge', weight: 2 },
    { phrase: 'cramm', weight: 4 }, { phrase: 'slamm', weight: 4 }, { phrase: 'roaming', weight: 2 },
    { phrase: 'data throttl', weight: 3 }, { phrase: 'early termination', weight: 2 }, { phrase: 'late fee', weight: 1.5 },
    { phrase: 'monthly bill', weight: 2 }, { phrase: 'canceled fee', weight: 2 }, { phrase: 'fcc', weight: 2 },
    { phrase: 'billing', weight: 1.5 },
  ],
  auto_repair: [
    { phrase: 'mechanic', weight: 4 }, { phrase: 'auto repair', weight: 4 }, { phrase: 'repair shop', weight: 2 },
    { phrase: 'oil change', weight: 3 }, { phrase: 'phantom repair', weight: 5 }, { phrase: 'check engine', weight: 3 },
    { phrase: 'brake', weight: 1.5 }, { phrase: 'transmission', weight: 2 }, { phrase: 'went to the dealer', weight: 2 },
    { phrase: 'charged me for', weight: 2 }, { phrase: 'airbag', weight: 2 }, { phrase: 'towed', weight: 1.5 },
    { phrase: 'car repair', weight: 4 },
  ],
  debt: [
    { phrase: 'debt collector', weight: 5 }, { phrase: 'collection agency', weight: 4 }, { phrase: 'collecting', weight: 2.5 },
    { phrase: 'harass', weight: 3 }, { phrase: 'called at night', weight: 4 }, { phrase: 'threaten', weight: 2 },
    { phrase: 'garnish', weight: 2 }, { phrase: 'credit bureau', weight: 2 }, { phrase: 'validate', weight: 2 },
    { phrase: 'wrong debt', weight: 4 }, { phrase: 'not my debt', weight: 4 }, { phrase: 'fdcpa', weight: 4 },
    { phrase: 'robocall', weight: 2 }, { phrase: 'lawsuit threat', weight: 3 },
  ],
  wages: [
    { phrase: 'unpaid wage', weight: 5 }, { phrase: 'paycheck', weight: 3 }, { phrase: 'wages', weight: 3 },
    { phrase: 'overtime', weight: 4 }, { phrase: 'final pay', weight: 4 }, { phrase: 'last check', weight: 3 },
    { phrase: 'minimum wage', weight: 3 }, { phrase: 'hours i worked', weight: 3 }, { phrase: 'timesheet', weight: 3 },
    { phrase: 'employer', weight: 2 }, { phrase: 'fired', weight: 1.5 }, { phrase: 'withheld my pay', weight: 4 },
    { phrase: 'salary', weight: 1.5 },
  ],
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const COMPILED: { lane: Exclude<LaneId, 'other'>; re: RegExp; weight: number; phrase: string }[] = (() => {
  const out: { lane: Exclude<LaneId, 'other'>; re: RegExp; weight: number; phrase: string }[] = [];
  const ruleLanes: Exclude<LaneId, 'other'>[] = ['food_illness', 'food_packaged', 'contractor', 'product_hazard', 'telecom', 'auto_repair', 'debt', 'wages'];
  for (const lane of ruleLanes) {
    for (const r of RULES[lane]) out.push({ lane, re: new RegExp('\\b' + escapeRe(r.phrase), 'i'), weight: r.weight, phrase: r.phrase });
  }
  return out;
})();

export interface RouteHit { lane: LaneId; score: number; matches: string[] }
export interface RouteResult {
  hits: RouteHit[];              /* all lanes with score > 0, best first */
  best: RouteHit | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  needsManual: boolean;          /* true when the user should just pick a lane */
}

export function routeComplaint(text: string, flags: { ill?: boolean } = {}): RouteResult {
  const t = text.trim();
  const hits: RouteHit[] = [];
  if (t) {
    const byLane = new Map<Exclude<LaneId, 'other'>, RouteHit>();
    for (const { lane, re, weight, phrase } of COMPILED) {
      if (!re.test(t)) { continue; }
      const hit = byLane.get(lane) ?? { lane, score: 0, matches: [] };
      hit.score += weight; hit.matches.push(phrase);
      byLane.set(lane, hit);
    }
    for (const hit of byLane.values()) {
      if (flags.ill && (hit.lane === 'food_illness' || hit.lane === 'food_packaged')) { hit.score += 3; hit.matches.push('reported illness'); }
      hits.push(hit);
    }
  } else if (flags.ill) {
    hits.push({ lane: 'food_illness', score: 3, matches: ['reported illness'] });
  }
  hits.sort((a, b) => b.score - a.score || a.lane.localeCompare(b.lane));
  const top = hits[0] ?? null;
  const second = hits[1] ?? null;
  let confidence: RouteResult['confidence'] = 'none';
  if (top) {
    const gap = second ? top.score - second.score : top.score;
    confidence = top.score >= 7 && gap >= 2 ? 'high' : top.score >= 4 ? 'medium' : 'low';
  }
  const needsManual = confidence === 'none' || confidence === 'low';
  return { hits, best: top, confidence, needsManual };
}
