/* Petty — Country Pack registry. Tier 1 launch ring (HIC); Phase 2 gated. Voice: legal pettiness to the core — every claim statutory, every link verified. */
export type Pillar = 'health' | 'weather' | 'dispatch' | 'stops' | 'courts' | 'money' | 'luggage';

/* Link audit 2026-11-26 (curl + browser UA, full log: reports/link-audit-2026-11-26.md).
 * wired = Petty fetches it at runtime (CORS-keyless, verified) · portal = page verified 200, not wired
 * bot-walled = 403 to automation (works in browsers) · unverifiable = no route from build network
 * gated = license/key required · queued = planned worker pool */
export type FeedVerdict = 'wired' | 'portal' | 'bot-walled' | 'unverifiable' | 'gated' | 'queued';
export interface Regulator {
  name: string; pillar: Pillar | 'GL'; url: string;
  license: 'public_domain' | 'api' | 'license_gated' | 'fee';
  cadence: 'realtime' | 'hourly' | 'weekly' | 'monthly';
  status: FeedVerdict;
  wireUrl?: string;
  note?: string;
}
export interface CountryPack {
  code: string; name: string; tier: 'launch' | 'phase2'; flag: string;
  currency: string; ppp: string | null;
  regulators: Regulator[];
}

export const PILLARS: { id: Pillar; label: string; blurb: string }[] = [
  { id: 'health', label: 'Recalls & Health', blurb: 'openFDA · FSA · MHRA · TGA · RASFF · WHO' },
  { id: 'weather', label: 'Weather & Hazards', blurb: 'NWS CAP · Met Office · MeteoAlarm · ECCC · BOM' },
  { id: 'dispatch', label: 'Public Safety & Dispatch', blurb: 'Recorded transmissions only — never live audio' },
  { id: 'stops', label: 'Police Stops & Commute', blurb: 'Aggregate density heatmaps — never exact pins' },
  { id: 'courts', label: 'Courts Watchdog', blurb: 'CourtListener workers · Find Case Law · CanLII/AustLII gated' },
  { id: 'money', label: 'Unclaimed Money', blurb: 'NAUPA · Treasury Hunt · UCF · Bona Vacantia · ASIC' },
  { id: 'luggage', label: 'Baggage Co-Pilot', blurb: 'DOT 254 · EU261/UK261 · APPR · Montreal 1999' },
];

const G = (name: string, pillar: Pillar | 'GL', url: string, cadence: Regulator['cadence'] = 'weekly',
           status: FeedVerdict = 'portal', note?: string, wireUrl?: string): Regulator =>
  note ? { name, pillar, url, license: 'public_domain', cadence, status, note, ...(wireUrl ? { wireUrl } : {}) }
       : { name, pillar, url, license: 'public_domain', cadence, status, ...(wireUrl ? { wireUrl } : {}) };

/* Surface doctrine — each surface shows only what it owns (see DESIGN.md §Surfaces):
 * Side-Eye  → health · weather · stops · money   (agency-checkable "what's on now")
 * Receipts  → courts (docket) · health (recall scanner)
 * Comeuppance→ luggage (baggage Co-Pilot)      Black Book → registry: everything
 */
export const RADAR_PILLARS = PILLARS.filter(p => (['health', 'weather', 'stops', 'money'] as Pillar[]).includes(p.id));

export const COUNTRY_PACKS: CountryPack[] = [
  { code: 'US', name: 'United States', tier: 'launch', flag: '🇺🇸', currency: 'USD', ppp: null, regulators: [
    G('openFDA — enforcement reports', 'health', 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts', 'weekly',
      'wired', 'CORS-open, keyless · Class I/II recalls, ongoing only', 'https://api.fda.gov/food/enforcement.json?search=status:ongoing'),
    G('CPSC — recalls', 'health', 'https://www.cpsc.gov/Recalls', 'weekly',
      'wired', 'Human page 403s automation · saferproducts.gov API is CORS-open + keyless — wired', 'https://www.saferproducts.gov/RestWebServices/Recall?format=json'),
    G('USDA FSIS — recalls', 'health', 'https://www.fsis.usda.gov/recalls', 'weekly',
      'bot-walled', '403 from build network (page + feeds) — link works in browsers; no JSON/CORS API published'),
    G('NOAA/NWS — alerts (CAP)', 'weather', 'https://www.weather.gov/documentation/services-web-api', 'realtime',
      'wired', 'api.weather.gov/alerts/active — CORS-open, keyless · CAP polygons via alert payloads', 'https://api.weather.gov/alerts/active'),
    G('NYPD collisions — Crashes (h9gi-nx95)', 'stops', 'https://data.cityofnewyork.us/Transportation/Motor-Vehicle-Collisions-Crashes/h9gi-nx95', 'monthly',
      'wired', 'Socrata SODA — CORS-open, keyless · wired in Field Wire', 'https://data.cityofnewyork.us/resource/h9gi-nx95.json'),
    G('DC — stop data (Socrata)', 'stops', 'https://dev.socrata.com/foundry/opendata.dc.gov', 'monthly',
      'portal', 'Docs verified 200 · not yet wired; NYPD feed wired instead'),
    { name: 'CourtListener REST v4 (worker pool)', pillar: 'courts', url: 'https://www.courtlistener.com/help/api', license: 'api', cadence: 'hourly', status: 'queued', note: 'Free token = 125 req/day · worker pool planned; deep-link + token lane live in Receipts' },
    G('Broadcastify Calls API (recorded)', 'dispatch', 'https://www.broadcastify.com/calls', 'realtime',
      'gated', 'Calls API requires a free account + key — page verified 200; not wired'),
    G('NAUPA / MissingMoney sweep', 'money', 'https://www.missingmoney.com', 'monthly',
      'bot-walled', '403 from build network — browsers render fine; no public API'),
    G('IRS — unclaimed refunds', 'money', 'https://www.irs.gov/refunds', 'monthly',
      'portal', 'Verified 200 (2026-11-26) · unclaimed refunds age out at 3 years · Where’s My Refund + amended-return route'),
    G('FDIC — failed-bank deposits', 'money', 'https://www.fdic.gov/consumer-resource-center/2020-12/how-find-long-lost-bank-account-or-safe-deposit-box', 'monthly',
      'portal', 'Verified 200 (2026-11-26) · unclaimed insured deposits from failed banks, + bank-failure list at fdic.gov/bank-failures'),
    G('PBGC — Missing Participants (pensions)', 'money', 'https://missingparticipants.pbgc.gov/', 'monthly',
      'unverifiable', 'Timeout from build network 2026-11-26 — re-verify from US vantage · free searchable database of unclaimed private-sector pensions'),
    G('DOL EBSA — Abandoned Plans', 'money', 'https://www.dol.gov/agencies/ebsa/employers-and-advisers/plan-information-and-registers/abandoned-plan-search', 'monthly',
      'bot-walled', '403 from build network (browsers render fine) · abandoned-plan search for dead-employer 401(k)s'),
    G('Treasury Hunt', 'money', 'https://www.treasurydirect.gov/savings-bonds/treasury-hunt/', 'monthly',
      'portal', 'URL corrected 2026-11-26 (old /indiv/tools link 505s) · no public API'),
    G('DOT 14 CFR Part 254 — fee refunds', 'luggage', 'https://www.transportation.gov/airconsumer', 'monthly',
      'bot-walled', '403 from build network — browsers render fine; statute wired deterministically in Comeuppance'),
  ]},
  { code: 'GB', name: 'United Kingdom', tier: 'launch', flag: '🇬🇧', currency: 'GBP', ppp: null, regulators: [
    G('FSA — food alerts (API)', 'health', 'https://data.food.gov.uk/food-alerts', 'weekly',
      'wired', 'OGL v3 · CORS-open, keyless · wired in Side-Eye + Receipts scanner · server search broken upstream (returns 0) — we client-filter', 'https://data.food.gov.uk/food-alerts/id.json?_sort=-created'),
    G('MHRA — drug & device alerts', 'health', 'https://www.gov.uk/drug-device-alerts', 'weekly',
      'portal', 'Alerts page verified · atom feed exists but sends no CORS headers — not browser-embeddable; subscribe in a reader'),
    G('Met Office', 'weather', 'https://www.metoffice.gov.uk', 'realtime',
      'portal', 'DataPoint needs a free key — not wired; page verified 200'),
    G('police.uk — stops-street + crimes', 'stops', 'https://data.police.uk/docs/method/stops-street/', 'monthly',
      'wired', 'OGL v3 · CORS-open, keyless · crimes + stops wired in Field Wire (URL fixed: /stops 404s)', 'https://data.police.uk/api/stops-street'),
    G('Find Case Law', 'courts', 'https://caselaw.nationalarchives.gov.uk', 'weekly',
      'wired', 'Open Justice Licence · CORS-open atom.xml — wired in Receipts › Docket (UK judgments lane)', 'https://caselaw.nationalarchives.gov.uk/atom.xml'),
    G('HMRC — Marriage Allowance (backdate 4 yrs)', 'money', 'https://www.gov.uk/marriage-allowance', 'monthly',
      'portal', 'Verified 200 (2026-11-26) · up to 4 tax years backdated — the pettiest £252 you’ll ever claim'),
    G('DWP/HMRC — Pension Tracing Service', 'money', 'https://www.gov.uk/find-pension-contact-details', 'monthly',
      'portal', 'Verified 200 (2026-11-26) · finds lost workplace pensions · free, official — £23.4bn sits unclaimed'),
    G('FSCS — when a regulated firm fails', 'money', 'https://www.fscs.org.uk/', 'monthly',
      'portal', 'Verified 200 (2026-11-26) · statutory compensation scheme of last resort for authorised firms'),
    G('Bona Vacantia — Crown', 'money', 'https://www.gov.uk/government/organisations/bona-vacantia', 'monthly',
      'portal', 'URL fixed 2026-11-26 (old collection link 404s) · no public API'),
    G('MyLostAccount', 'money', 'https://www.mylostaccount.org.uk', 'monthly',
      'bot-walled', '403 from build network — browsers render fine; no public API'),
    G('CAA — UK261 denied boarding', 'luggage', 'https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/denied-boarding/', 'monthly',
      'portal', 'URL replaced 2026-11-26 (caasbis.com is not a CAA property) · statute wired deterministically in Comeuppance'),
  ]},
  { code: 'CA', name: 'Canada', tier: 'launch', flag: '🇨🇦', currency: 'CAD', ppp: null, regulators: [
    G('CFIA & Health Canada — recalls', 'health', 'https://recalls-rappels.canada.ca', 'weekly',
      'portal', 'Page verified 200 · no keyless JSON/GeoJSON feed published; EFT 404s · not wired'),
    G('ECCC — weather alerts (GeoMet)', 'weather', 'https://weather.gc.ca', 'realtime',
      'wired', 'OGC API Features, keyless + CORS-open · issued/continued only · wired in Side-Eye (weather)', 'https://api.weather.gc.ca/collections/weather-alerts/items'),
    { name: 'CanLII (license-gated)', pillar: 'courts', url: 'https://www.canlii.org', license: 'license_gated', cadence: 'weekly', status: 'gated', note: 'Licence-gated; 403 from build network' },
    G('Bank of Canada — unclaimed balances', 'money', 'https://www.unclaimedproperties.bankofcanada.ca/', 'monthly',
      'portal', 'URL corrected 2026-11-26 (unclaimed-balances 301s here) · search portal, no public API'),
    G('CRA — uncashed cheques', 'money', 'https://www.canada.ca/en/revenue-agency/services/e-services/cra-login-services/uncashed-cheques.html', 'monthly',
      'unverifiable', 'Akamai refused TCP from build network 2026-11-26 (000) — browsers render fine · $1.8bn+ uncashed federal cheques, never expire'),
    G('CTA — APPR flight rights', 'luggage', 'https://otc-cta.gc.ca/en/airlines-and-other-rms', 'monthly',
      'unverifiable', 'Akamai edge refused TCP from build network 2026-11-26 (000) — re-verify from a CA vantage; statute wired deterministically in Comeuppance'),
  ]},
  { code: 'AU', name: 'Australia', tier: 'launch', flag: '🇦🇺', currency: 'AUD', ppp: null, regulators: [
    G('TGA — recalls & safety alerts', 'health', 'https://www.tga.gov.au/safety/alerts-and-recalls', 'weekly',
      'unverifiable', 'Akamai edge refused TCP from build network 2026-11-26 (000) — re-verify from AU vantage; no JSON/CORS API evident'),
    G('FSANZ — food standards', 'health', 'https://www.foodstandards.gov.au', 'weekly',
      'portal', 'Page verified 200 · no keyless API published; not wired'),
    G('BOM — warnings', 'weather', 'https://reg.bom.gov.au/australia/warnings/', 'realtime',
      'portal', 'URL corrected 2026-11-26 (bom.gov.au/warnings 404s) · HTML bulletins only — no keyless API; not wired'),
    { name: 'AustLII (license-gated)', pillar: 'courts', url: 'https://www.austlii.edu.au', license: 'license_gated', cadence: 'weekly', status: 'gated', note: 'Licence-gated; 403 from build network' },
    G('ASIC MoneySmart — unclaimed money', 'money', 'https://moneysmart.gov.au/find-unclaimed-money', 'monthly',
      'bot-walled', '403 from build network — browsers render fine; no public API'),
    G('ATO — unclaimed super', 'money', 'https://www.ato.gov.au/individuals-and-families/super/keeping-track-of-your-super/lost-and-unclaimed-super', 'monthly',
      'bot-walled', '403 from build network (browsers render fine) · $16bn+ lost/unclaimed super, ATO-held'),
    G('Montreal 1999 — baggage (aviation consumer protections)', 'luggage', 'https://www.infrastructure.gov.au/infrastructure-transport-vehicles/aviation/aviation-consumer-protections', 'monthly',
      'unverifiable', 'Page exists per gov publications; Akamai refused TCP from build network 2026-11-26 (000); Montreal wired deterministically in Comeuppance'),
  ]},
  { code: 'GL', name: 'Global backbone', tier: 'launch', flag: '🌐', currency: 'USD', ppp: null, regulators: [
    G('WHO — News (English) RSS', 'health', 'https://www.who.int/emergencies/disease-outbreak-news', 'weekly',
      'wired', 'DON has no keyless feed (legacy RSS 404s) · we wire WHO News (English) RSS + label it exactly — wired in Side-Eye (GL)', 'https://www.who.int/rss-feeds/news-english.xml'),
    G('OECD GlobalRecalls', 'health', 'https://globalrecalls.oecd.org', 'weekly',
      'portal', 'Page verified 200 · probed /api, /api/v1/recalls, ?format=json — all 404; no public machine API found 2026-11-26'),
    G('WMO — hazardous weather bulletins', 'weather', 'https://public.wmo.int', 'realtime',
      'portal', 'Redirects to wmo.int (200) · bulletins are PDF/HTML — no keyless JSON API; not wired'),
    G('ECC-Net — cross-border EU consumer disputes', 'money', 'https://www.eccnet.eu/', 'monthly',
      'portal', 'Verified 200 (2026-11-26) · European Consumer Centres — free help when an EU trader owes you; 30 centres'),
    G('Montreal Convention 1999 (ICAO)', 'luggage', 'https://www.icao.int/secretariat/legal', 'monthly',
      'bot-walled', '403 from build network — browsers render fine; Montreal wired deterministically in Comeuppance'),
  ]},
];


export const PHASE2_PACKS = [
  { code: 'NG', name: 'Nigeria (flagship)', flag: '🇳🇬', gate: '≥2 machine feeds (NAFDAC · SON · NiMet · SEC e-Dividend) · NGN rails (cards/transfer/USSD) · PPP validated · retention ≥35%', unlocks: ['NAFDAC recalls', 'NiMet hazards', 'NCAA Part 19 ($1,000)', 'SEC e-Dividend claims', 'Lagos pilot: unclaimed funds'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', gate: 'SAHPRA feed · SAWS API · NCC recalls · ZAR rails · POPIA sign-off', unlocks: ['SAHPRA', 'SAWS', 'NCC recalls'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', gate: 'CDSCO feed · IMD API · CCPA/consumer forum access · UPI rails', unlocks: ['CDSCO', 'IMD'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', gate: 'Anvisa API · INMET feed · ANATEL? · PIX rails', unlocks: ['Anvisa', 'INMET'] },
];

export const PRICING = [
  { id: 'radar', name: 'The Side-Eye', price: '$9', per: '/mo', annual: '$86/yr (−20%)', blurb: 'All launch-ring signals, weekly digest, 1 market', cta: 'Start free trial' },
  { id: 'plus', name: 'The Comeuppance', price: '$19', per: '/mo', annual: '$182/yr (−20%)', blurb: 'Everything + Receipts scanner, Comeuppance packets, priority docket alerts', cta: 'Upgrade to Plus', featured: true },
  { id: 'sentinel', name: 'Sentinel (agents)', price: '$49', per: '/mo', annual: '$470/yr (−20%)', blurb: 'Bloomberg-of-liability: API access, 4 seats, SLA, regulator-grade exports', cta: 'Talk to sales' },
];
