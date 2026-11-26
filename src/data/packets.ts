/* Petty — statutory packet registries (US launch ring). No LLM, no invention:
 * every figure below was read from the primary source on 2026-11-26 (see reports/link-audit-2026-11-26.md
 * and reports/settlements-audit-2026-11-26.md). Statutory text changes; the UI always prints
 * "retrieved 2026-11-26" next to each citation. */

/* ================= Tenant deposit ================= */
export interface DepositStatute {
  state: 'NY' | 'CA' | 'TX' | 'FL' | 'IL';
  law: string;                 /* named citation, always shown */
  returnDays: number;          /* days from vacating for the refund/statement */
  itemizeNote: string;         /* what must accompany any retained amount */
  penalty: string;             /* plain-language penalty clause */
  premiseNote: string;         /* extra condition to the clock, if any */
  url: string | null;          /* official source, null if unreachable from build network 2026-11-26 */
}

export const DEPOSIT_STATUTES: DepositStatute[] = [
  {
    state: 'NY', law: 'N.Y. Gen. Oblig. Law § 7-108(1-a)(e), (f), (g)', returnDays: 14,
    itemizeNote: 'Itemized statement of the basis for ANY amount retained, plus the balance — within 14 days of vacating.',
    penalty: 'Miss 14 days → landlord forfeits right to retain ANY portion. Willful violation → punitive damages up to 2× the deposit. Landlord bears burden of proof on reasonableness.',
    premiseNote: 'Lease cannot waive § 7-108 (§ 7-108(1-a)(h) is void). Deposit cap = 1 month (§ 7-108(1-a)(a)).',
    url: 'https://www.nysenate.gov/legislation/laws/GOB/7-108',
  },
  {
    state: 'CA', law: 'Cal. Civ. Code § 1950.5(g), (l)', returnDays: 21,
    itemizeNote: 'Itemized statement + receipts for any line item over $125 — within 21 days of vacating.',
    penalty: 'Bad-faith retention → up to 2× the deposit in statutory damages ON TOP of the wrongfully withheld amount (§ 1950.5(l)), plus fees in some courts.',
    premiseNote: 'One-month deposit cap since Jul 1 2024 (AB 12). Demand letter first — courts treat silence past day 21 as bad-faith evidence.',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1950.5&lawCode=CIV',
  },
  {
    state: 'TX', law: 'Tex. Prop. Code ch. 92 (§ 92.103, § 92.109)', returnDays: 30,
    itemizeNote: 'Written, itemized description and amount of deductions + balance — within 30 days.',
    penalty: 'Bad faith → $100 + 3× the wrongfully withheld portion + your reasonable attorney fees (§ 92.109(a)). Miss day 30 → presumption of bad faith (§ 92.109(d)). No itemization in bad faith → landlord loses right to keep any of it (§ 92.109(b)).',
    premiseNote: 'THE CLOCK RUNS ONLY AFTER you give a written forwarding address (§ 92.107) — send it certified, keep the receipt.',
    url: null, /* official statutes page served a JS shell from build network 2026-11-26 — search "Texas Property Code 92.109" or visit statutes.capitol.texas.gov */
  },
  {
    state: 'FL', law: 'Fla. Stat. § 83.49(3) (2023, incl. 2023C)', returnDays: 15,
    itemizeNote: 'No-claim path: full deposit returned within 15 days. Claim path: landlord must send notice (certified mail) of intent to impose a claim within 30 days.',
    penalty: 'No compliant 30-day claim notice → landlord FORFEITS right to impose any claim (forfeiture, not just a dispute). You then have 15 days to object to a claim notice; prevailing party recovers attorney fees and costs (§ 83.49(3)(c)).',
    premiseNote: 'Landlord must mail notice WITHIN 30 days OF YOU MOVING OUT, and you must object IN WRITING within 15 days of receiving it — or the claim stands.',
    url: 'https://www.flsenate.gov/Laws/Statutes/2023/83.49',
  },
  {
    state: 'IL', law: '765 ILCS 710/1 (Illinois Security Deposit Return Act)', returnDays: 45,
    itemizeNote: 'Itemized statement WITH receipts within 30 days; failing that, the full deposit within 45 days.',
    penalty: 'Willful/bad-faith refusal of the statement or return → 2× the deposit + court costs + reasonable attorney fees (765 ILCS 710/1). Applies to all landlords since Jan 1 2024 (threshold removed).',
    premiseNote: 'RLTO Chicago (5-12-080) and Cook County RTLO are stricter — deposit cap, receipt, account and interest rules. Chicago: also 2× + fees.',
    url: null, /* ilga.gov returned an error from build network 2026-11-26 — search "765 ILCS 710" or visit ilga.gov */
  },
];

/* ================= Unpaid wages / final paycheck ================= */
export interface WageStatute {
  state: 'NY' | 'CA' | 'TX' | 'FL' | 'IL' | 'FEDERAL';
  scope: string;
  figures: string;             /* plain-language multiplier/deadline */
  note: string;
  url: string | null;
}

export const WAGE_STATUTES: WageStatute[] = [
  {
    state: 'FEDERAL', scope: 'All states — Fair Labor Standards Act', figures: 'Unpaid minimum wage / OT → back wages + EQUAL amount liquidated (29 U.S.C. § 216(b)). SOL 2 yrs, 3 if willful (§ 255(a)). Good-faith defense can trim liquidated (§ 260).',
    note: 'File free with DOL Wage & Hour Division — they investigate, you pay nothing.',
    url: 'https://www.dol.gov/agencies/whd',
  },
  {
    state: 'NY', scope: 'New York — Labor Law §§ 191, 198(1-a)', figures: 'Liquidated damages = 100% of wages found due, UNLESS employer proves good faith (§ 198(1-a)). NYLL 6-yr SOL. 9% interest accrues from the date wages were due.',
    note: 'File free with NYSDOL or the attorney-general; private action alternative.',
    url: 'https://dol.ny.gov/',
  },
  {
    state: 'CA', scope: 'California — Lab. Code §§ 201, 202, 203, 226.7', figures: 'Final pay: immediately if fired · within 72h of quitting (immediately if 72h notice given). Willful failure → one DAY’S WAGES per calendar day late, CAP 30 days (§ 203). Meal/rest violations → 1hr premium pay each (§ 226.7). File free with the Labor Commissioner (DLSE).',
    note: 'Vacation payout is vested wages (§ 227.3) — use-or-lose-it policies are void.',
    url: 'https://www.dir.ca.gov/',
  },
  {
    state: 'TX', scope: 'Texas — FLSA + TWC payday law ch. 61', figures: 'No general state penalty multiplier on wages; recovery runs through FLSA (back wages + equal liquidated, 2/3yr SOL) or a free TWC wage claim — document hours, keep the demand in writing.',
    note: 'TWC wage claim is free and fast when the employer simply never paid.',
    url: null, /* twc.texas.gov not fetched from build network 2026-11-26 — verify before linking */
  },
  {
    state: 'FL', scope: 'Florida — FLSA + Fla. Stat. § 448.110', figures: 'No general state multiplier on ordinary wages; FLSA applies. Minimum-wage violations: § 448.110 — notice letter then suit; double the unpaid minimum wages as liquidated damages.',
    note: 'No Florida wage agency — federal DOL WHD is the venue; private bar for statutory claims.',
    url: null, /* floridajobs.myflorida.com not fetched 2026-11-26 — verify before linking */
  },
  {
    state: 'IL', scope: 'Illinois — FLSA + 820 ILCS 115 (IWPCA)', figures: 'FLSA applies. IWPCA: final wages due on next regularly scheduled payday; nonpayment penalty 2% of the unpaid amount per month (820 ILCS 115/14). IDOL accepts free wage claims.',
    note: 'Chicago: RLTO-style worker ordinances add protections — check city too.',
    url: null, /* idol.illinois.gov not fetched 2026-11-26 — verify before linking */
  },
];

/* ================= US consumer settlement watchlist ================= */
export type SettlementStatus = 'open' | 'expired';
export interface SettlementEntry {
  id: string; title: string; defendant: string; caseNo: string; court: string;
  category: string; amount: string; perPerson: string; eligibility: string[];
  deadline: string;              /* ISO yyyy-mm-dd */
  status: SettlementStatus; claimUrl: string;
  verifiedAt: string; sourceNote: string;
}

/* Only entries fetch-verified 2026-11-26 belong here. Anything that lapses renders EXPIRED, never claimable. */
export const SETTLEMENTS: SettlementEntry[] = [
  {
    id: 'apple-intelligence-iphone-16-2026',
    title: 'Apple Intelligence / iPhone 16 false advertising — $250M fund',
    defendant: 'Apple Inc.', caseNo: '5:25-cv-02668', court: 'N.D. Cal.',
    category: 'False advertising',
    amount: '$250,000,000', perPerson: '≈ $25 per device (pro rata up to $95)',
    eligibility: [
      'US resident',
      'Purchased (not resale) an iPhone 15 Pro, 15 Pro Max, or any iPhone 16 model between Jun 10 2024 and Mar 29 2025, in the US',
      'Original purchaser; personal or business use',
      'Apple Account email or device serial number available (helps but not required to file online)',
    ],
    deadline: '2026-12-21',
    status: 'open',
    claimUrl: 'https://smartphoneaisettlement.com/',
    verifiedAt: '2026-11-26',
    sourceNote: 'Official settlement administrator site fetched 2026-11-26: claim period opened Sep 21 2026; online + postmark deadline Dec 21 2026; final approval hearing Feb 24 2027; agreement not an admission of wrongdoing. Cross-checked vs publisher notices (claimdepot, theverge, tomsguide) — dates agree.',
  },
];
