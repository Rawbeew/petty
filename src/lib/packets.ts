/* Petty — deterministic packet engines (tenant deposit, unpaid wages) + settlement watchlist math.
 * Every computation here mirrors the cited statutes in src/data/packets.ts — no LLM, no guessing.
 * Always verify against current law before filing; Petty is information, not legal advice. */

export type DepositState = 'NY' | 'CA' | 'TX' | 'FL' | 'IL';

export interface DepositInput {
  state: DepositState;
  depositUsd: number;      /* deposit paid */
  withheldUsd: number;     /* what landlord kept (0 if nothing returned) */
  vacatedOn: string;       /* ISO date the tenant vacated */
  forwardingAddressGiven: boolean;  /* TX clock condition */
}

export interface DepositVerdict {
  deadline: string;        /* ISO date the refund/statement was due */
  daysLate: number;        /* vs today (0 if not yet late / not past deadline) */
  overdue: boolean;
  withheld: number;
  exposureMin: number;     /* floor of plausible statutory exposure */
  exposureMax: number;     /* ceiling incl. penalty multipliers */
  penaltyRule: string;
  actionNote: string;
}

const DAY = 86400_000;
const addDays = (iso: string, days: number): string => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new Error('vacatedOn must be an ISO date');
  return new Date(t + days * DAY).toISOString().slice(0, 10);
};
const daysSince = (iso: string, now: Date): number => Math.floor((now.getTime() - Date.parse(iso)) / DAY);

export function computeDeposit(i: DepositInput, now: Date = new Date()): DepositVerdict {
  const withheld = Math.max(0, i.withheldUsd);
  const deposit = Math.max(0, i.depositUsd);
  switch (i.state) {
    case 'NY': {
      const deadline = addDays(i.vacatedOn, 14);
      const daysLate = Math.max(0, daysSince(deadline, now) + 1);
      const overdue = daysLate > 0;
      return {
        deadline, daysLate: overdue ? daysLate : 0, overdue, withheld,
        exposureMin: withheld,               /* forfeiture: full refund of anything retained */
        exposureMax: withheld + 2 * deposit, /* forfeiture + punitive ≤2× deposit (willful) */
        penaltyRule: 'N.Y. GOL § 7-108(1-a)(e): miss 14 days → forfeit right to retain ANY portion. § (g): willful → punitive up to 2× deposit. Landlord bears burden of proof.',
        actionNote: 'Send the demand letter (certified mail). If ignored, Small Claims is the venue; bring the lease, photos, forwarding address proof.',
      };
    }
    case 'CA': {
      const deadline = addDays(i.vacatedOn, 21);
      const daysLate = Math.max(0, daysSince(deadline, now) + 1);
      const overdue = daysLate > 0;
      return {
        deadline, daysLate: overdue ? daysLate : 0, overdue, withheld,
        exposureMin: withheld,
        exposureMax: withheld + 2 * deposit, /* wrongfully withheld + bad-faith ≤2× */
        penaltyRule: 'Cal. Civ. Code § 1950.5(l): bad faith → up to 2× the deposit ON TOP of the amount wrongfully withheld. Receipts required for deductions over $125 (§ 1950.5(g)(2)).',
        actionNote: 'Demand letter with the § 1950.5(g)/(l) cite, the receipt hunt ($125 threshold), and a 14-day deadline. Small Claims limit in CA is $12,500.',
      };
    }
    case 'TX': {
      const deadline = addDays(i.vacatedOn, 30);
      const daysLate = i.forwardingAddressGiven ? Math.max(0, daysSince(deadline, now) + 1) : 0;
      const overdue = daysLate > 0;
      return {
        deadline: i.forwardingAddressGiven ? deadline : `${deadline} — but the clock never started: give a written forwarding address first`,
        daysLate: overdue ? daysLate : 0, overdue, withheld,
        exposureMin: withheld + 100,
        exposureMax: withheld + 100 + 3 * withheld, /* $100 + 3× wrongfully withheld (+ fees) */
        penaltyRule: 'Tex. Prop. Code § 92.109(a): bad faith → $100 + 3× the wrongfully withheld portion + your attorney fees. § 92.109(d): missing day 30 → presumption of bad faith. Clock conditions on written forwarding address (§ 92.107).',
        actionNote: i.forwardingAddressGiven
          ? 'Forwarding address given → 30-day clock is live. Demand letter; if it fails, Justice Court (JP court) is the venue.'
          : 'Send the forwarding address in writing (certified mail, keep the receipt) — Texas hands the landlord a free reset button until you do.',
      };
    }
    case 'FL': {
      const noClaim = addDays(i.vacatedOn, 15);
      const claimNotice = addDays(i.vacatedOn, 30);
      const overdue = daysSince(noClaim, now) >= 0;
      const daysLate = overdue ? Math.max(0, daysSince(noClaim, now) + 1) : 0;
      return {
        deadline: `${noClaim} (no claim) · ${claimNotice} (landlord’s claim-notice window)`,
        daysLate, overdue, withheld,
        exposureMin: withheld,               /* forfeiture of claim right */
        exposureMax: withheld,               /* deposit itself must be repaid; prevailing-party attorney fees shift UNCAPPED (§ 83.49(3)(c)) — shown in rule, not faked into a number */
        penaltyRule: 'Fla. Stat. § 83.49(3): no timely 30-day certified claim notice → landlord FORFEITS the right to impose any claim. Prevailing party recovers attorney fees and costs (§ 83.49(3)(c)).',
        actionNote: 'If a claim notice arrived: object IN WRITING within 15 days of receipt or it stands. No notice by day 30+ → demand the full deposit back; the claim is forfeited as a matter of law.',
      };
    }
    case 'IL': {
      const deadline = addDays(i.vacatedOn, 45);
      const daysLate = Math.max(0, daysSince(deadline, now) + 1);
      const overdue = daysLate > 0;
      return {
        deadline, daysLate: overdue ? daysLate : 0, overdue, withheld,
        exposureMin: withheld,
        exposureMax: 2 * Math.max(deposit, withheld), /* statutory double + fees/costs */
        penaltyRule: '765 ILCS 710/1: willful/bad-faith refusal → 2× the deposit + court costs + reasonable attorney fees. Statement with receipts due in 30 days; full return in 45 absent a compliant statement.',
        actionNote: 'Chicago RLTO and Cook County RTLO are stricter (cap, interest, 2×). IDOL/court small claims; cite the 30/45 dates and demand receipts for every deduction line.',
      };
    }
  }
}

export interface WageInput {
  state: 'NY' | 'CA' | 'TX' | 'FL' | 'IL' | 'FEDERAL';
  unpaidWagesUsd: number;   /* straight wages owed */
  otHours: number;          /* unpaid OT hours */
  hourlyRateUsd: number;    /* regular hourly rate for FLSA OT math */
  finalPayDaysLate: number; /* 0 if still employed or paid on time */
  dailyRateUsd: number;     /* for CA waiting-time penalty */
}

export interface WageVerdict {
  flsaBackWages: number;     /* unpaid straight + OT premium */
  flsaLiquidated: number;    /* equal amount — 29 U.S.C. § 216(b) */
  flsaTotal: number;         /* back + liquidated */
  statePenalty: number;      /* state-specific cap-aware addition */
  stateRule: string;
  note: string;
}

export function computeWageClaim(i: WageInput): WageVerdict {
  const straight = Math.max(0, i.unpaidWagesUsd);
  const ot = Math.max(0, i.otHours) * Math.max(0, i.hourlyRateUsd) * 0.5; /* FLSA OT = 1.5× → the half-time premium; straight part is in unpaidWages if user includes it */
  const flsaBackWages = straight + ot;
  const flsaLiquidated = flsaBackWages;
  const flsaTotal = flsaBackWages * 2;
  switch (i.state) {
    case 'FEDERAL':
      return { flsaBackWages, flsaLiquidated, flsaTotal,
        statePenalty: 0,
        stateRule: 'FLSA only — back wages + equal liquidated (29 U.S.C. § 216(b)). 2-yr SOL, 3 if willful (§ 255(a)). Good-faith defense can trim liquidated (§ 260).',
        note: 'Federal safe harbor: file free with DOL WHD — no lawyer required, no fee, they investigate.' };
    case 'NY':
      return { flsaBackWages, flsaLiquidated, flsaTotal,
        statePenalty: Math.max(0, i.unpaidWagesUsd), /* NY LL §198(1-a): 100% of wages found due */
        stateRule: 'NY Labor Law § 198(1-a) — liquidated = 100% of wages found due (good-faith defense aside); 6-yr SOL; 9% interest from due date.',
        note: 'Do not double count: FLSA liquidated and NYLL liquidated are not both stacked — the recovery tracks the stronger path. 9% interest is on top.' };
    case 'CA': {
      const days = Math.min(30, Math.max(0, Math.floor(i.finalPayDaysLate)));
      return { flsaBackWages, flsaLiquidated, flsaTotal,
        statePenalty: days * Math.max(0, i.dailyRateUsd),
        stateRule: 'Cal. Lab. Code § 203 — willful late final pay → one day’s wages per calendar day late, cap 30 days (immediate on firing; 72h after quit). Vacation payout vests (§ 227.3).',
        note: 'Willfulness is required for § 203; DLSE (Labor Commissioner) takes claims free — no lawyer needed for the conference.' };
    }
    case 'TX':
    case 'FL':
    case 'IL':
      return { flsaBackWages, flsaLiquidated, flsaTotal,
        statePenalty: 0,
        stateRule: i.state === 'IL'
          ? 'IL: FLSA path + IWPCA 2% per month on unpaid wages (820 ILCS 115/14) — demand + IDOL free claim.'
          : i.state === 'TX'
            ? 'TX: FLSA path or free TWC wage claim; no state liquidated multiplier beyond FLSA.'
            : 'FL: FLSA path; minimum-wage claims get § 448.110 notice-then-double damages; no general state multiplier.',
        note: 'FLSA willfulness stretches the SOL from 2 to 3 years — document how the employer knew.' };
  }
}

export function daysUntil(isoDate: string, now: Date = new Date()): number {
  return Math.ceil((Date.parse(isoDate) - now.getTime()) / DAY);
}

export function settlementStatus(s: { status: 'open' | 'expired'; deadline: string }, now: Date = new Date()): 'open' | 'expired' {
  if (s.status === 'expired') return 'expired';
  return daysUntil(s.deadline, now) >= 0 ? 'open' : 'expired';
}

/* ============ Deterministic demand letter (tenant deposit) ============ */
export function depositLetter(i: DepositInput & { landlordName: string; propertyAddress: string; yourAddress: string; yourName: string }): string {
  const v = computeDeposit(i);
  const cite = {
    NY: 'N.Y. Gen. Oblig. Law § 7-108(1-a)(e) and (g)',
    CA: 'Cal. Civ. Code § 1950.5(g) and (l)',
    TX: 'Tex. Prop. Code §§ 92.103, 92.109',
    FL: 'Fla. Stat. § 83.49(3)',
    IL: '765 ILCS 710/1',
  }[i.state];
  const demand = i.state === 'TX' ? `$${(i.withheldUsd + 100 + 3 * i.withheldUsd).toFixed(2)} (withheld $${i.withheldUsd.toFixed(2)} + $100 + 3× wrongfully withheld)` : `$${i.withheldUsd.toFixed(2)} plus any statutory penalties available`;
  return [
    i.yourAddress,
    ``,
    new Date().toISOString().slice(0, 10),
    ``,
    i.landlordName,
    ``,
    `Re: Security deposit — ${i.propertyAddress}`,
    ``,
    `Dear ${i.landlordName}:`,
    ``,
    `I vacated the premises at ${i.propertyAddress} on ${i.vacatedOn}. Under ${cite}, the return of my security deposit ($${i.depositUsd.toFixed(2)}) with an itemized statement of any deductions was due by ${v.deadline.split(' —')[0]}.`,
    ``,
    `To date, the sum of $${i.withheldUsd.toFixed(2)} remains withheld${i.withheldUsd === 0 ? ' (full deposit)' : ''}. This letter is a formal demand for payment of ${demand} within fourteen (14) days of the date of this letter.`,
    ``,
    `If payment in full is not received within that window, I will pursue every remedy available to me, including filing in the appropriate court, and will seek all available statutory damages, fees and costs.`,
    ``,
    `This letter is informational and is not legal advice. I reserve all rights and remedies.`,
    ``,
    `Sincerely,`,
    ``,
    i.yourName,
  ].join('\n');
}
