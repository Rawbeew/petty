/* Petty Radar — deterministic statutory engine. No LLM in the compliance path.
 * Simplified rules; always verify against current regulation + SDR rates before filing.
 * Sources: US 14 CFR Part 254 · EU261/UK261 · CTA APPR · Montreal Convention 1999 · NCAA Part 19 (Phase 2) */

export const SDR_TO_USD = 1.31; // approx — verify daily at IMF
export const MONTREAL_CAP_SDR = 1519;
export const USD_PER_SDR_CAP = Math.round(MONTREAL_CAP_SDR * SDR_TO_USD);

export type RouteKind = 'us_domestic' | 'us_international_le12' | 'us_international_gt12' | 'eu' | 'uk' | 'ca' | 'intl';

/* ---------- US DOT 14 CFR Part 254: checked-bag FEE refund ---------- */
export function usDotFeeRefundEligible(args: { route: 'us_domestic' | 'us_international_le12' | 'us_international_gt12'; delayHours: number }): { eligible: boolean; threshold: number; rule: string } {
  const threshold = args.route === 'us_domestic' ? 12 : args.route === 'us_international_le12' ? 15 : 30;
  return {
    eligible: args.delayHours >= threshold,
    threshold,
    rule: `14 CFR Part 254 — automatic refund of reasonable checked-bag fees when delivery exceeds ${threshold}h (${args.route === 'us_domestic' ? 'US domestic' : 'intl ' + (args.route === 'us_international_le12' ? '≤12h flight' : '>12h flight')} threshold).`,
  };
}

/* ---------- US DOT / Montreal liability caps ---------- */
export function liabilityCaps() {
  return [
    { regime: 'US DOT (domestic, 14 CFR §254.6)', cap: '$4,700', note: 'Adjusted periodically — verify current figure before quoting.' },
    { regime: 'Montreal 1999 (international)', cap: `${MONTREAL_CAP_SDR} SDR (~US$${USD_PER_SDR_CAP})`, note: 'Cap per passenger; SDR rate per IMF daily. 7d written notice = damage; 21d = delay.' },
  ];
}

/* ---------- EU261 / UK261 denied boarding / arrival delay ≥3h ---------- */
export function eu261(distanceKm: number): { euros: number; band: string; note: string } {
  if (distanceKm <= 1500) return { euros: 250, band: '≤ 1,500 km', note: 'Intra-EU short haul.' };
  if (distanceKm <= 3500) return { euros: 400, band: '1,500–3,500 km', note: 'Medium haul / intra-EU long.' };
  return { euros: 600, band: '> 3,500 km', note: 'Long haul. Non-intra-EU >3,500km: €300 if arrival delay 3–4h.' };
}

/* ---------- CTA APPR (Canada) — large carrier, delay/denied ---------- */
export function apprLargeCarrier(hoursLate: number): { cad: number | null; tier: string; note: string } {
  if (hoursLate < 3) return { cad: 0, tier: '< 3h', note: 'No minimum compensation below 3h.' };
  if (hoursLate < 6) return { cad: 400, tier: '3–6h', note: 'Large carrier. Small carrier: C$125.' };
  if (hoursLate < 9) return { cad: 700, tier: '6–9h', note: 'Large carrier. Small carrier: C$250.' };
  return { cad: 1000, tier: '≥ 9h', note: 'Large carrier. Small carrier: C$500. Communication required.' };
}

/* ---------- Montreal Convention written-notice windows ---------- */
export function montrealNotice(kind: 'damaged' | 'delayed'): { days: number; consequence: string } {
  return kind === 'damaged'
    ? { days: 7, consequence: 'Failure to give written notice within 7 days of receipt raises a presumption against you — act today.' }
    : { days: 21, consequence: 'Written notice within 21 days of bag being placed at your disposal.' };
}

/* ---------- Full luggage assessment ---------- */
export interface LuggageInput {
  route: RouteKind;
  distanceKm: number;
  delayHours: number;
  flightHours: number;
  arrivalDelayHours: number;
  interimExpensesUsd: number;
  damaged: boolean;
  delayed: boolean;
  airline: string;
  pnr: string;
}

export interface LuggageAssessment {
  feeRefund: ReturnType<typeof usDotFeeRefundEligible> | null;
  euComp: { euros: number; band: string; payable: boolean } | null;
  apprComp: { cad: number | null; tier: string } | null;
  montreal: { capUsd: number; noticeDays: number; noticeKind: 'damaged' | 'delayed'; warning: string };
  headline: string;
  checklist: string[];
}

export function assessLuggage(i: LuggageInput): LuggageAssessment {
  const feeRefund = (i.route === 'us_domestic' || i.route === 'us_international_le12' || i.route === 'us_international_gt12')
    ? usDotFeeRefundEligible({ route: i.route, delayHours: i.delayHours })
    : null;
  const euOk = i.route === 'eu' || i.route === 'uk';
  const euRaw = euOk ? eu261(i.distanceKm) : null;
  const euComp = euRaw ? { ...euRaw, payable: i.arrivalDelayHours >= 3 } : null;
  const apprComp = i.route === 'ca' ? (() => { const r = apprLargeCarrier(i.arrivalDelayHours); return { cad: r.cad, tier: r.tier }; })() : null;
  const kind: 'damaged' | 'delayed' = i.damaged ? 'damaged' : 'delayed';
  const notice = montrealNotice(kind);
  const montreal = {
    capUsd: USD_PER_SDR_CAP,
    noticeDays: notice.days,
    noticeKind: kind,
    warning: notice.consequence,
  };
  const checklist = [
    'Report at baggage service desk BEFORE leaving airport — get PIR number in writing.',
    `Written notice to airline within ${notice.days} days (${kind}) — keep proof of posting.`,
    'Itemise interim purchases: toiletries, clothing, medication — keep every receipt.',
    feeRefund?.eligible ? 'Claim automatic checked-bag fee refund under 14 CFR Part 254 (airline MUST auto-refund).' : 'Fee refund threshold not met — pursue expenses under Montreal instead.',
    euComp?.payable ? `EU261/UK261: demand €${euComp.euros} (${euComp.band}) — cite Reg. 261/2004 Art. 7.` : '',
    apprComp?.cad ? `CTA APPR: demand C$${apprComp.cad} (${apprComp.tier}) — cite APPR large-carrier schedule.` : '',
    `Cap: Montreal ${MONTREAL_CAP_SDR} SDR (~US$${USD_PER_SDR_CAP}) per passenger — file within 2 years of arrival.`,
    'If refused: escalate to DOT Aviation Consumer Protection (US) / CAA (UK) / CTA (CA) / NEB equivalent, then small-claims.',
  ].filter(Boolean);
  const headline = feeRefund?.eligible
    ? `Automatic fee refund triggers at ${feeRefund.threshold}h — you are owed this by law.`
    : euComp?.payable
      ? `EU261/UK261 likely entitles you to €${euComp.euros}.`
      : `Montreal caps recovery at ~US$${USD_PER_SDR_CAP}; act within ${notice.days} days.`;
  return { feeRefund, euComp, apprComp, montreal, headline, checklist };
}

/* ---------- Demand letter (slots only; never raw PII into any model) ---------- */
export function luggageLetter(i: LuggageInput & { passengerName: string; flightNo: string; bagTag: string; address: string }): string {
  const a = assessLuggage(i);
  return [
    new Date().toISOString().slice(0, 10),
    ``,
    `${i.airline} — Customer Relations / Baggage Claims`,
    `Re: Delayed/damaged checked baggage — ${i.passengerName} · PNR ${i.pnr} · Flight ${i.flightNo} · Bag tag ${i.bagTag}`,
    ``,
    `To whom it concerns,`,
    ``,
    `I demand (1) a full refund of checked-bag fees and (2) compensation/reimbursement for costs and losses under applicable law:`,
    i.route.startsWith('us_') ? `- US DOT 14 CFR Part 254 — automatic fee refund; Part 254.6 domestic liability cap US$4,700.` : '',
    (i.route === 'eu' || i.route === 'uk') ? `- Regulation (EC) No 261/2004 / UK261 — Art. 7 fixed compensation by distance band.` : '',
    i.route === 'ca' ? `- CTA Air Passenger Protection Regulations — large-carrier delay/denial schedule (CAD).` : '',
    `- Montreal Convention 1999 — Art. 17(2), 19; cap ${MONTREAL_CAP_SDR} SDR; written notice within 7/21 days; claim within 2 years.`,
    ``,
    `Assessment: ${a.headline}`,
    `Interim expenses incurred: US$${i.interimExpensesUsd.toFixed(2)} (receipts enclosed/available).`,
    ``,
    `Please confirm the fee refund and provide your claim reference within 14 calendar days. Failure to respond will proceed to the competent regulator (DOT Aviation Consumer Protection / CAA / CTA) and, if necessary, small-claims court.`,
    ``,
    `Yours faithfully,`,
    i.passengerName,
    i.address,
  ].filter(Boolean).join('\n');
}

/* ---------- Unclaimed-money permutation builder ---------- */
const COMMON_SWAPS: [RegExp, string][] = [
  [/i{2,}/g, 'i'], [/e{2,}/g, 'e'], [/o{2,}/g, 'o'], [/y/g, 'i'], [/ph/g, 'f'], [/ck/g, 'k'],
];
export function namePermutations(first: string, last: string, maiden?: string): string[] {
  const out = new Set<string>();
  const caps = (s: string) => s.trim().replace(/\s+/g, ' ');
  const F = caps(first), L = caps(last), M = maiden ? caps(maiden) : '';
  const add = (s: string) => { const t = s.trim(); if (t) out.add(t); };
  add(`${F} ${L}`); add(`${L}, ${F}`); add(`${F[0]}. ${L}`); add(`${F} ${L[0]}.`);
  add(`${F}${L}`); add(`${F[0]}${L}`); add(`${F}-${L}`); add(`${F} ${L.split(' ')[0]}`);
  const bases = [F, L, M].filter(Boolean);
  for (const b of bases) for (const [re, rep] of COMMON_SWAPS) add(b.replace(re, rep));
  if (M) {
    add(`${F} ${M}`); add(`${M} ${F}`); add(`${M}, ${F}`); add(`${F[0]}. ${M[0]}. ${L}`);
    add(`${F} ${M} ${L}`); add(`${M}-${L} ${F}`);
  }
  // phonetic buckets (classic)
  const phon = (s: string) => s.toLowerCase().replace(/ph/g, 'f').replace(/c([eiy])/g, 's$1').replace(/ee/g, 'e');
  add(`${phon(F)} ${phon(L)}`); add(`${phon(L)} ${phon(F)}`);
  return [...out].slice(0, 32);
}

export function addressPermutations(street: string, city: string, zip: string): string[] {
  const out = new Set<string>();
  const s = street.trim().replace(/\s+/g, ' ');
  const variants = [s, s.replace(/Street/i, 'St'), s.replace(/\bSt\b\.?/i, 'Street'), s.replace(/Avenue/i, 'Ave'), s.replace(/\bAve\b\.?/i, 'Avenue'), s.replace(/Road/i, 'Rd'), s.replace(/Apartment/i, 'Apt'), s.replace(/\bApt\b\.?/i, 'Apartment'), s.replace(/Suite/i, 'Ste'), s.replace(/\d+/g, (m) => m)];
  for (const v of variants) { out.add(`${v}, ${city} ${zip}`); out.add(`${v}, ${city}`); }
  return [...out].slice(0, 16);
}

export interface ClaimTarget { name: string; url: string; covers: string; market: 'US' | 'UK' | 'CA' | 'AU' | 'GL' }
export function claimTargets(markets: string[]): ClaimTarget[] {
  const all: ClaimTarget[] = [
    { name: 'MissingMoney (state treasurers, US)', url: 'https://www.missingmoney.com', covers: 'Forgotten bank accounts, deposits, securities, refunds', market: 'US' },
    { name: 'TreasuryDirect — Treasury Hunt', url: 'https://www.treasurydirect.gov/savings-bonds/treasury-hunt/', covers: 'Matured US savings bonds, bearer securities', market: 'US' },
    { name: 'US Courts — Unclaimed Funds (UCF)', url: 'https://www.uscourts.gov/court-programs/bankruptcy/unclaimed-funds-bankruptcy', covers: 'Restitution & unclaimed judgments', market: 'US' },
    { name: 'Bona Vacantia division (UK Gov)', url: 'https://www.gov.uk/government/organisations/bona-vacantia', covers: 'Estates & dissolved/dormant assets (England & Wales)', market: 'UK' },
    { name: 'MyLostAccount', url: 'https://www.mylostaccount.org.uk', covers: 'UK lost bank/building society/NS&I accounts', market: 'UK' },
    { name: 'Bank of Canada — unclaimed balances', url: 'https://www.unclaimedproperties.bankofcanada.ca/', covers: 'Dormant bank balances (10+ yrs)', market: 'CA' },
    { name: 'BC Unclaimed Property Society', url: 'https://unclaimedproperty.ca', covers: 'BC dormant businesses & bank property', market: 'CA' },
    { name: 'ASIC MoneySmart — unclaimed money', url: 'https://moneysmart.gov.au/find-unclaimed-money', covers: 'Bank/life/super/securities (AU federal)', market: 'AU' },
  ];
  return all.filter(t => markets.includes(t.market));
}
