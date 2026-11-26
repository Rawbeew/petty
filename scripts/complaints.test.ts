/* Petty — complaint desk engines: deterministic router + per-lane letters. No network. */
import { LANES, routeComplaint, type LaneId } from '../src/lib/complaints';
import { buildComplaintLetter } from '../src/lib/complaintLetters';
import { US_STATES, stateByCode } from '../src/data/states';

let failures = 0;
const ok = (cond: boolean, label: string) => { console.log((cond ? 'PASS' : 'FAIL'), '-', label); if (!cond) failures++; };

/* registry integrity */
ok(LANES.length === 9, 'lanes: exactly 9 registered');
ok(new Set(LANES.map(l => l.id)).size === LANES.length, 'lanes: ids unique');
ok(LANES.every(l => l.who.length > 10 && l.portal.length > 5 && l.note.length > 10), 'lanes: every lane has who/portal/note');

/* router: each lane wins on a representative complaint */
const ROUTE_CASES: [string, LaneId][] = [
  ['food poisoning at the diner last night, vomiting and diarrhea ever since', 'food_illness'],
  ['The milk carton smelled sour — lot code printed EXP 2025, label said organic', 'food_packaged'],
  ['Roofer took my deposit and never finish the job — home improvement contract', 'contractor'],
  ['The space heater caught fire and melted the plug — burned the carpet', 'product_hazard'],
  ['My carrier keeps sneaking extra charge and cramm fees onto my monthly bill', 'telecom'],
  ['Mechanic charged me for a brake job he never did — auto repair ripoff', 'auto_repair'],
  ['Debt collector called at night threatening a lawsuit over a debt that is not mine', 'debt'],
  ['My employer withheld my last paycheck and the overtime hours I worked', 'wages'],
];
for (const [text, want] of ROUTE_CASES) {
  const r = routeComplaint(text, { ill: want === 'food_illness' });
  ok(r.best?.lane === want, `router: “${text.slice(0, 34)}…” → ${want}`);
}

/* router: gibberish admits it cannot match (needsManual) */
const junk = routeComplaint('asdf qwer zxcv');
ok(junk.best === null && junk.needsManual, 'router: gibberish → no lane, needsManual=true (honest silence)');
ok(routeComplaint('', { ill: true }).best?.lane === 'food_illness', 'router: illness flag with no text → food_illness');

/* router: illness flag boosts food lanes */
const boosted = routeComplaint('I ate at a restaurant and now I am sick with nausea', { ill: true });
ok(boosted.best?.lane === 'food_illness', 'router: ill flag boosts food_illness');

/* letters: every lane builds a complete, lane-specific document */
const facts = { business: 'Test Roofing Co', date: '2026-11-01', what: 'Took $3,000 deposit, vanished.', ill: false };

/* US registry: 50 states + DC, audited 2026-11-26 */
ok(US_STATES.length === 51, 'US registry: 50 states + DC');
ok(new Set(US_STATES.map(s2 => s2.code)).size === 51, 'US registry: unique codes');
ok(US_STATES.every(s2 => s2.url === null || s2.url.startsWith('https://')), 'US registry: https only');
ok(US_STATES.every(s2 => /^\d{4}-\d{2}-\d{2}$/.test(s2.verifiedAt)), 'US registry: audit date on every row');
ok(US_STATES.filter(s2 => s2.status === 'bot-walled').length === 4, 'US registry: exactly 4 bot-walled (AK/KS/MA/NH), all labeled');
const ms = US_STATES.find(s2 => s2.code === 'MS');
ok(ms ? ms.url === null && ms.status === 'unverified' : false, 'US registry: MS not linked (off-gov redirect)');
const tx = US_STATES.find(s2 => s2.code === 'TX');
if (!tx) throw new Error('TX missing from registry');
ok(stateByCode('CA')?.url === 'https://oag.ca.gov/', 'US registry: CA → oag.ca.gov');
const withState = buildComplaintLetter('contractor', facts, tx);
ok(withState.includes('Texas Attorney General'), 'letter[state]: state AG office named in contractor lane');
ok(withState.includes('texasattorneygeneral.gov'), 'letter[state]: state portal url included');
const msFound = US_STATES.find(s2 => s2.code === 'MS');
if (!msFound) throw new Error('MS missing from registry');
const msLetter = buildComplaintLetter('other', facts, msFound);
ok(msLetter.includes('Mississippi Attorney General') && !msLetter.includes('attorneygenerallynnfitch'), 'letter[MS]: office named, off-gov domain never rendered');
ok(buildComplaintLetter('wages', facts, tx).includes('216(b)'), 'letter[state]: federal wages lane ignores state AG but stays valid');

for (const l of LANES) {
  const letter = buildComplaintLetter(l.id, facts);
  ok(letter.includes(l.who), `letter[${l.id}]: addressed to lane regulator`);
  ok(letter.includes('Test Roofing Co') && letter.includes('2026-11-01'), `letter[${l.id}]: user facts plugged in`);
  ok(!/undefined|\[object Object\]/.test(letter), `letter[${l.id}]: no artifacts`);
  ok(letter.includes('truthfully and in good faith'), `letter[${l.id}]: good-faith close`);
  ok(letter.includes('not legal advice'), `letter[${l.id}]: not-a-lawyer disclaimer`);
}
ok(buildComplaintLetter('wages', facts).includes('216(b)'), 'letter[wages]: cites FLSA § 216(b)');
ok(buildComplaintLetter('debt', facts).includes('FDCPA'), 'letter[debt]: cites FDCPA');
ok(buildComplaintLetter('food_packaged', facts).includes('UPC'), 'letter[food_packaged]: UPC/lot traceability block present');
ok(buildComplaintLetter('food_illness', facts).includes('inspection'), 'letter[food_illness]: requests inspection');

console.log(failures === 0 ? '\ncomplaints engine: all assertions passed' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
