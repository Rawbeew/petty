/* Petty — 50 states + DC: official Attorney General consumer-protection portals.
 * Every URL was machine-audited 2026-11-26 (curl, follow redirects) from the build network.
 * status: verified (2xx) | bot-walled (official .gov/.state site, 403 to bots, opens in your browser)
 *         | unverified (MS: ago.state.ms.us 301s off-gov to a campaign domain — named, not linked).
 * Do NOT hand-edit a URL without re-running the audit and bumping verifiedAt. */
export type AGStatus = 'verified' | 'bot-walled' | 'unverified';
export interface StateAG { code: string; name: string; office: string; url: string | null; status: AGStatus; verifiedAt: string }
export const US_STATES: StateAG[] = [
  { code: 'AL', name: 'Alabama', office: 'Alabama Attorney General — Consumer Protection', url: 'https://www.alabamaag.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'AK', name: 'Alaska', office: 'Alaska Attorney General — Consumer Protection', url: 'https://law.alaska.gov/', status: 'bot-walled', verifiedAt: '2026-11-26' },
  { code: 'AZ', name: 'Arizona', office: 'Arizona Attorney General — Consumer Protection', url: 'https://www.azag.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'AR', name: 'Arkansas', office: 'Arkansas Attorney General — Consumer Protection', url: 'https://arkansasag.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'CA', name: 'California', office: 'California Attorney General — Consumer Protection', url: 'https://oag.ca.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'CO', name: 'Colorado', office: 'Colorado Attorney General — Consumer Protection', url: 'https://coag.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'CT', name: 'Connecticut', office: 'Connecticut Attorney General — Consumer Protection', url: 'https://portal.ct.gov/ag', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'DE', name: 'Delaware', office: 'Delaware Attorney General — Consumer Protection', url: 'https://attorneygeneral.delaware.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'DC', name: 'District of Columbia', office: 'District of Columbia Attorney General — Consumer Protection', url: 'https://oag.dc.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'FL', name: 'Florida', office: 'Florida Attorney General — Consumer Protection', url: 'https://www.myfloridalegal.com/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'GA', name: 'Georgia', office: 'Georgia Attorney General — Consumer Protection', url: 'https://law.georgia.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'HI', name: 'Hawaii', office: 'Hawaii Attorney General — Consumer Protection', url: 'https://ag.hawaii.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'ID', name: 'Idaho', office: 'Idaho Attorney General — Consumer Protection', url: 'https://www.ag.idaho.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'IL', name: 'Illinois', office: 'Illinois Attorney General — Consumer Protection', url: 'https://www.illinoisattorneygeneral.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'IN', name: 'Indiana', office: 'Indiana Attorney General — Consumer Protection', url: 'https://www.in.gov/attorneygeneral/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'IA', name: 'Iowa', office: 'Iowa Attorney General — Consumer Protection', url: 'https://www.iowaattorneygeneral.gov/for-consumers/file-a-consumer-complaint', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'KS', name: 'Kansas', office: 'Kansas Attorney General — Consumer Protection', url: 'https://www.ag.ks.gov/', status: 'bot-walled', verifiedAt: '2026-11-26' },
  { code: 'KY', name: 'Kentucky', office: 'Kentucky Attorney General — Consumer Protection', url: 'https://ag.ky.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'LA', name: 'Louisiana', office: 'Louisiana Attorney General — Consumer Protection', url: 'https://www.ag.state.la.us/Home', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'ME', name: 'Maine', office: 'Maine Attorney General — Consumer Protection', url: 'https://www.maine.gov/ag/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'MD', name: 'Maryland', office: 'Maryland Attorney General — Consumer Protection', url: 'https://oag.maryland.gov/Pages/oag.aspx', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'MA', name: 'Massachusetts', office: 'Massachusetts Attorney General — Consumer Protection', url: 'https://www.mass.gov/orgs/office-of-attorney-general', status: 'bot-walled', verifiedAt: '2026-11-26' },
  { code: 'MI', name: 'Michigan', office: 'Michigan Attorney General — Consumer Protection', url: 'https://www.michigan.gov/ag', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'MN', name: 'Minnesota', office: 'Minnesota Attorney General — Consumer Protection', url: 'https://www.ag.state.mn.us/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'MS', name: 'Mississippi', office: 'Mississippi Attorney General — Consumer Protection', url: null, status: 'unverified', verifiedAt: '2026-11-26' },
  { code: 'MO', name: 'Missouri', office: 'Missouri Attorney General — Consumer Protection', url: 'https://ago.mo.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'MT', name: 'Montana', office: 'Montana Attorney General — Consumer Protection', url: 'https://dojmt.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'NE', name: 'Nebraska', office: 'Nebraska Attorney General — Consumer Protection', url: 'https://ago.nebraska.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'NV', name: 'Nevada', office: 'Nevada Attorney General — Consumer Protection', url: 'https://ag.nv.gov/Contact/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'NH', name: 'New Hampshire', office: 'New Hampshire Attorney General — Consumer Protection', url: 'https://www.doj.nh.gov/', status: 'bot-walled', verifiedAt: '2026-11-26' },
  { code: 'NJ', name: 'New Jersey', office: 'New Jersey Attorney General — Consumer Protection', url: 'https://www.njoag.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'NM', name: 'New Mexico', office: 'New Mexico Attorney General — Consumer Protection', url: 'https://nmdoj.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'NY', name: 'New York', office: 'New York Attorney General — Consumer Protection', url: 'https://ag.ny.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'NC', name: 'North Carolina', office: 'North Carolina Attorney General — Consumer Protection', url: 'https://www.ncdoj.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'ND', name: 'North Dakota', office: 'North Dakota Attorney General — Consumer Protection', url: 'https://attorneygeneral.nd.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'OH', name: 'Ohio', office: 'Ohio Attorney General — Consumer Protection', url: 'https://www.ohioattorneygeneral.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'OK', name: 'Oklahoma', office: 'Oklahoma Attorney General — Consumer Protection', url: 'https://oklahoma.gov/oag.html', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'OR', name: 'Oregon', office: 'Oregon Attorney General — Consumer Protection', url: 'https://www.doj.state.or.us/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'PA', name: 'Pennsylvania', office: 'Pennsylvania Attorney General — Consumer Protection', url: 'https://www.attorneygeneral.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'RI', name: 'Rhode Island', office: 'Rhode Island Attorney General — Consumer Protection', url: 'https://riag.ri.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'SC', name: 'South Carolina', office: 'South Carolina Attorney General — Consumer Protection', url: 'https://www.scag.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'SD', name: 'South Dakota', office: 'South Dakota Attorney General — Consumer Protection', url: 'https://atg.sd.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'TN', name: 'Tennessee', office: 'Tennessee Attorney General — Consumer Protection', url: 'https://www.tn.gov/attorneygeneral/working-for-tennessee/consumer/file-a-complaint.html', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'TX', name: 'Texas', office: 'Texas Attorney General — Consumer Protection', url: 'https://www.texasattorneygeneral.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'UT', name: 'Utah', office: 'Utah Attorney General — Consumer Protection', url: 'https://ag.utah.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'VT', name: 'Vermont', office: 'Vermont Attorney General — Consumer Protection', url: 'https://ago.vermont.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'VA', name: 'Virginia', office: 'Virginia Attorney General — Consumer Protection', url: 'https://www.oag.state.va.us/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'WA', name: 'Washington', office: 'Washington Attorney General — Consumer Protection', url: 'https://www.atg.wa.gov/', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'WV', name: 'West Virginia', office: 'West Virginia Attorney General — Consumer Protection', url: 'https://ago.wv.gov/consumer-protection/file-complaint-consumer-protection-division', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'WI', name: 'Wisconsin', office: 'Wisconsin Attorney General — Consumer Protection', url: 'https://wisdoj.gov/Pages/home.aspx', status: 'verified', verifiedAt: '2026-11-26' },
  { code: 'WY', name: 'Wyoming', office: 'Wyoming Attorney General — Consumer Protection', url: 'https://ag.wyo.gov/', status: 'verified', verifiedAt: '2026-11-26' },
];

export const stateByCode = (code: string): StateAG | null => US_STATES.find(s => s.code === code) ?? null;
export const isStateAG = (v: string): v is string => US_STATES.some(s => s.code === v);
