/* Petty — per-lane official complaint letters. Deterministic text, user's facts plugged in.
 * Each lane gets its own subject line, legal hooks (only ones verified in-repo or universally
 * factual) and its own asks. Common envelope: truthful/good-faith, not advice, no guarantee. */
import { LANES, type LaneId, type Lane } from './complaints';
import type { StateAG } from '../data/states';

export interface ComplaintFacts {
  business: string;
  date: string;
  what: string;
  ill: boolean;
}

const laneOrThrow = (id: LaneId): Lane => {
  const found = LANES.find(l => l.id === id);
  if (!found) throw new Error(`unknown-lane:${id}`);
  return found;
};
const LANE_MAP: Record<LaneId, Lane> = {
  food_illness: laneOrThrow('food_illness'), food_packaged: laneOrThrow('food_packaged'), contractor: laneOrThrow('contractor'),
  product_hazard: laneOrThrow('product_hazard'), telecom: laneOrThrow('telecom'), auto_repair: laneOrThrow('auto_repair'),
  debt: laneOrThrow('debt'), wages: laneOrThrow('wages'), other: laneOrThrow('other'),
};

const AG_LANES: LaneId[] = ['contractor', 'auto_repair', 'debt', 'other'];

const env = (lane: Lane, facts: ComplaintFacts, reLine: string, body: string[], ag?: StateAG | null): string => {
  const today = new Date().toISOString().slice(0, 10);
  const stateBlock = ag && AG_LANES.includes(lane.id) ? [
    'STATE ROUTING',
    ` - ${ag.office}`,
    ` - Portal: ${ag.url ?? `unverified from audit network 2026-11-26 — search “${ag.name} Attorney General consumer complaint” and use the official portal result`}`,
    ' - Reference this letter when you file with the state AG consumer complaint form.',
    '',
  ] : [];
  return [
    'PETTY — OFFICIAL COMPLAINT LETTER (generated on this device; facts are yours)',
    `Generated: ${today}`,
    '',
    `TO: ${lane.who}`,
    `CHANNEL: ${lane.portal}`,
    '',
    `RE: ${reLine}`,
    '',
    ...stateBlock,
    `Business / establishment: ${facts.business.trim() || '(fill in — exact legal/trading name as it appeared)'}`,
    `Date(s) of incident: ${facts.date.trim() || '(fill in)'}`,
    '',
    'WHAT HAPPENED',
    facts.what.trim() || '(describe what was promised vs what happened — receipts, names, amounts, dates…)',
    '',
    `Illness or injury involved: ${facts.ill ? 'YES — I sought/attended medical care; records retained' : 'No illness or injury reported by me'}`,
    '',
    ...body,
    '',
    'EVIDENCE (held on my device; copies available to you on request)',
    ' - Photographs: scene/product/label panels/lot codes/receipts — attached or available',
    ' - Original receipt and any packaging, contract, work order, bill, or communication — retained',
    ' - Medical documentation where illness or injury occurred — available on your request',
    '',
    'I make this complaint truthfully and in good faith. I understand no outcome is guaranteed,',
    'that this letter is not legal advice and creates no attorney–client relationship, and that this',
    'filing does not waive any parallel rights or remedies I may have.',
    '',
    '(Your name, address, phone, email and signature — fill in before sending)',
  ].join('\n');
};

export function buildComplaintLetter(laneId: LaneId, facts: ComplaintFacts, ag?: StateAG | null): string {
  const lane = LANE_MAP[laneId];
  switch (laneId) {
    case 'food_illness':
      return env(lane, facts, 'Foodborne illness complaint — request for inspection and inquiry', [
        'WHAT I ATE AND WHEN',
        '(Enumerate each dish/drink, times consumed, onset of symptoms, current condition — and, if known, whether others who ate with you fell ill too.)',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Log this complaint, assign a reference number, and confirm it in writing.',
        ' 2. Inspect the establishment named above — food-handler hygiene, temperature control, storage, cross-contamination.',
        ' 3. If this matches other recent reports, treat it as a possible outbreak and escalate per your protocol.',
        ' 4. Tell me in writing what (if anything) your inspection found.',
        '',
        'I have retained any remaining food sample and all packaging. Tell me before you need them — I understand they are perishable and can only be held so long.',
      ], ag);
    case 'food_packaged':
      return env(lane, facts, 'Reportable food problem — product, UPC and lot below', [
        'PRODUCT IDENTIFICATION (the traceability key)',
        ' - Product name and description:',
        ' - Brand / manufacturer / distributor:',
        ' - UPC:                    Lot / batch code:',
        ' - Best-by / use-by date:  Net weight:',
        ' - Where purchased / when:',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign a report reference and confirm receipt.',
        ' 2. Trace this lot through distribution and evaluate it against your recall classification (Class I–III).',
        ' 3. If a recall or market withdrawal is warranted, initiate it and notify me; if not, tell me why in writing.',
        ' 4. Preserve this report for pattern analysis against other complaints on the same lot.',
        '',
        'I am keeping the product, packaging and receipt. I did not consume (or I consumed and was affected by) the portions described above.',
      ], ag);
    case 'contractor':
      return env(lane, facts, 'Contractor complaint — licensing, payment and non/poor performance', [
        'THE TRANSACTION',
        ' - Contract / agreement date and amount:',
        ' - Deposit paid and date:         Amount invoiced:',
        ' - Contractor license number (if known):',
        ' - Work promised vs work actually performed (itemise):',
        ' - Deadlines missed / defects / abandonment date:',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign a complaint reference and confirm receipt.',
        ' 2. Verify the contractor’s license status and complaint history; open a disciplinary inquiry if warranted.',
        ' 3. Where you have restitution authority, exercise it; where you do not, tell me the correct forum.',
        ' 4. Notify me in writing of the outcome and any recourse timelines that apply.',
        '',
        'I have the contract, invoices, receipts, photos of the work state and our written communications.',
      ], ag);
    case 'product_hazard':
      return env(lane, facts, 'Product hazard report — defect, incident and potential for harm', [
        'THE PRODUCT',
        ' - Product name / model / serial:',
        ' - Manufacturer / importer / retailer:',
        ' - Date of purchase and place:',
        ' - Where was it being used and by whom (age/children in the home if relevant):',
        '',
        'THE INCIDENT',
        '(Describe failure sequence: what happened, in what order, what it touched, what was damaged or who was hurt, exact conditions.)',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign a report reference and confirm receipt.',
        ' 2. Evaluate the defect against your substantial-product-hazard criteria for recall classification.',
        ' 3. Cross-match this incident against prior reports on the model; if a pattern exists, act.',
        ' 4. Tell me in writing whether the product has been or will be investigated.',
      ], ag);
    case 'telecom':
      return env(lane, facts, 'Informal complaint — billing / service abuse by provider', [
        'THE ACCOUNT',
        ' - Provider:                     Account number:',
        ' - Service type (wireless / broadband / cable / landline):',
        ' - Disputed charges and amounts:',
        ' - Billing periods:',
        '',
        'WHAT I TRIED FIRST',
        ' - Support calls / chats (dates, reference numbers, names):',
        ' - Executive escalation / dispute filed (date):',
        ' - Result so far:',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Serve this complaint on the provider and require their written response to you and me.',
        ' 2. Review the disputed charges against the filed tariff/contract terms.',
        ' 3. If the provider fails to respond adequately, take enforcement action as your authority allows.',
        ' 4. Tell me how to escalate to small claims or arbitration if the money is not recovered.',
      ], ag);
    case 'auto_repair':
      return env(lane, facts, 'Auto repair complaint — estimate vs actual, unauthorised work', [
        'THE VEHICLE AND THE SHOP',
        ' - Vehicle year/make/model/VIN (if known):',
        ' - Shop name and address:          Repair order number:',
        ' - Date in / date out:',
        '',
        'THE GAP',
        ' - Estimate given (amount + what was listed):',
        ' - Final bill (amount + what was actually charged):',
        ' - Work performed without my authorisation (if any):',
        ' - Problem recurred / work defective / unsafe (describe):',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign a complaint reference and confirm receipt.',
        ' 2. Investigate the shop against your auto-repair standards (estimate rules, authorisation, itemisation).',
        ' 3. Where you have restitution authority, use it; otherwise, tell me the correct forum.',
        ' 4. Notify me in writing of the outcome.',
      ], ag);
    case 'debt':
      return env(lane, facts, 'Debt collection complaint — request for investigation', [
        'THE COLLECTION',
        ' - Collector / agency name:       Account reference they gave me:',
        ' - Original creditor (if known):  Alleged amount:',
        ' - Dates and times of their contacts (logs attached):',
        ' - What they said / did that I dispute (quote as closely as you can):',
        ' - Whether I have disputed in writing and when:',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign a complaint reference and confirm receipt.',
        ' 2. Open an investigation into whether the collector complied with the federal Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. § 1692 et seq.) and any state counterpart.',
        ' 3. Require the collector to respond to you and to me in writing, including validation of the debt.',
        ' 4. Correct credit-reporting entries I have shown to be inaccurate, per your processes.',
        '',
        'I have the call log, letters, texts and envelopes. I am disputing the debt in good faith and I want the record straight more than I want the calls to stop.',
      ], ag);
    case 'wages':
      return env(lane, facts, 'Unpaid wages intake — request for investigation', [
        'THE EMPLOYMENT',
        ' - Employer legal name and address:',
        ' - Job title and dates employed:',
        ' - Pay rate and pay period:',
        ' - Approximate wages owed (run Petty’s unpaid-wage engine for exact FLSA/state math):',
        ' - Overtime hours worked and unpaid (dates/periods):',
        ' - Final paycheck withheld (last day worked / amount):',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign an intake reference and confirm receipt.',
        ' 2. Open a Wage & Hour investigation: unpaid minimum wage, overtime, and recordkeeping violations.',
        ' 3. Recover back wages and any liquidated damages the FLSA provides (29 U.S.C. § 216(b)) and note any state-law additions (e.g. NYLL § 198(1-a); CA Lab. Code § 203) that your office enforces.',
        ' 4. Tell me in writing what my rights are if the investigation stalls — including the limitations bridge to court.',
        '',
        'I have pay stubs, timesheets/schedules, offer letters and termination communications.',
      ], ag);
    case 'other':
      return env(lane, facts, 'Consumer complaint — request for review and response', [
        'THE GRIEVANCE',
        '(State plainly what was promised, what was delivered, what it cost you, and what you have already tried — complaints, refunds requested, responses received.)',
        '',
        'WHAT I ASK OF YOU',
        ' 1. Assign a complaint reference and confirm receipt.',
        ' 2. Review this against your consumer-protection mandate — deceptive practices, unfair contract terms, licensing, safety.',
        ' 3. Tell me in writing (a) whether you can act, (b) if so, what you need from me, (c) if not, which agency can.',
        ' 4. Where thousands share this fact pattern, consider treating this file as one of many toward a pattern inquiry.',
      ], ag);
  }
}
