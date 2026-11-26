/* Petty — packet engine unit tests. Deterministic; no network. */
import { computeDeposit, computeWageClaim, daysUntil, settlementStatus, depositLetter } from '../src/lib/packets';
import { DEPOSIT_STATUTES, WAGE_STATUTES, SETTLEMENTS } from '../src/data/packets';

let failures = 0;
const ok = (cond: boolean, label: string) => { console.log((cond ? 'PASS' : 'FAIL'), '-', label); if (!cond) failures++; };

const NOW = new Date('2026-11-26T12:00:00Z');

/* --- registry integrity --- */
ok(DEPOSIT_STATUTES.length === 5, 'deposit registry: 5 states (NY/CA/TX/FL/IL)');
ok(DEPOSIT_STATUTES.every(d => d.law.length > 0 && d.returnDays > 0 && d.penalty.length > 10), 'deposit registry: every entry cites statute + penalty');
ok(WAGE_STATUTES.length === 6, 'wage registry: federal + 5 states');
ok(SETTLEMENTS.length >= 1 && SETTLEMENTS.every(s => s.claimUrl.startsWith('https://') && /^\d{4}-\d{2}-\d{2}$/.test(s.deadline)), 'settlements: https claims + ISO deadlines only');
ok(SETTLEMENTS.every(s => s.verifiedAt === '2026-11-26'), 'settlements: fetch-verified today');
ok(DEPOSIT_STATUTES.every(d => d.verifiedAt === '2026-11-26'), 'deposit registry: verifiedAt stamped (2026-11-26)');
ok(WAGE_STATUTES.every(w => w.verifiedAt === '2026-11-26'), 'wage registry: verifiedAt stamped (2026-11-26)');

/* --- NY: 14 days + forfeiture --- */
const ny = computeDeposit({ state: 'NY', depositUsd: 2000, withheldUsd: 2000, vacatedOn: '2026-10-01', forwardingAddressGiven: true }, NOW);
ok(ny.deadline === '2026-10-15', 'NY deadline = vacated + 14d');
ok(ny.overdue && ny.daysLate > 0, 'NY overdue past day 14');
ok(ny.exposureMax === 2000 + 4000, 'NY exposure max = withheld + 2× deposit');
ok(ny.exposureMin === 2000, 'NY exposure min = wrongfully withheld');

/* --- CA: 21 days + 2× bad faith --- */
const ca = computeDeposit({ state: 'CA', depositUsd: 3000, withheldUsd: 1500, vacatedOn: '2026-10-01', forwardingAddressGiven: true }, NOW);
ok(ca.deadline === '2026-10-22', 'CA deadline = vacated + 21d');
ok(ca.overdue && ca.exposureMax === 1500 + 6000, 'CA exposure max = withheld + 2× deposit');

/* --- TX: clock gated on forwarding address --- */
const txNo = computeDeposit({ state: 'TX', depositUsd: 1000, withheldUsd: 1000, vacatedOn: '2026-09-01', forwardingAddressGiven: false }, NOW);
ok(!txNo.overdue && txNo.daysLate === 0, 'TX: no forwarding address → clock not running');
const txYes = computeDeposit({ state: 'TX', depositUsd: 1000, withheldUsd: 1000, vacatedOn: '2026-09-01', forwardingAddressGiven: true }, NOW);
ok(txYes.overdue, 'TX: forwarding address given → clock runs');
ok(txYes.exposureMin === 1000 + 100, 'TX exposure min = $100 + withheld');
ok(txYes.exposureMax === 1000 + 100 + 3000, 'TX exposure max = $100 + 3× wrongfully withheld');

/* --- FL: 15/30 structure --- */
const fl = computeDeposit({ state: 'FL', depositUsd: 1200, withheldUsd: 1200, vacatedOn: '2026-11-26', forwardingAddressGiven: true }, NOW);
ok(fl.deadline.startsWith('2026-12-11'), 'FL no-claim deadline = vacated + 15d');
ok(!fl.overdue, 'FL same-day move-out is not yet overdue');
const flLate = computeDeposit({ state: 'FL', depositUsd: 1200, withheldUsd: 1200, vacatedOn: '2026-10-01', forwardingAddressGiven: true }, NOW);
ok(flLate.overdue, 'FL: past day 15 without return → forfeiture posture');

/* --- IL: 30/45 two-step --- */
const il = computeDeposit({ state: 'IL', depositUsd: 1800, withheldUsd: 1800, vacatedOn: '2026-09-01', forwardingAddressGiven: true }, NOW);
ok(il.deadline === '2026-10-16', 'IL deadline = vacated + 45d');
ok(il.exposureMax === 3600, 'IL exposure max = 2× deposit');

/* --- wages: FLSA double --- */
const federal = computeWageClaim({ state: 'FEDERAL', unpaidWagesUsd: 3000, otHours: 0, hourlyRateUsd: 0, finalPayDaysLate: 0, dailyRateUsd: 0 });
ok(federal.flsaTotal === 6000, 'FLSA § 216(b): wages + equal liquidated');
ok(federal.statePenalty === 0, 'TX/FL: no state multiplier on ordinary wages');
const nyWage = computeWageClaim({ state: 'NY', unpaidWagesUsd: 5000, otHours: 0, hourlyRateUsd: 0, finalPayDaysLate: 0, dailyRateUsd: 0 });
ok(nyWage.statePenalty === 5000, 'NY LL § 198(1-a): 100% liquidated');
const caWage = computeWageClaim({ state: 'CA', unpaidWagesUsd: 1000, otHours: 0, hourlyRateUsd: 0, finalPayDaysLate: 45, dailyRateUsd: 200 });
ok(caWage.statePenalty === 30 * 200, 'CA § 203: one day’s wages × days late, cap 30');
const caWage10 = computeWageClaim({ state: 'CA', unpaidWagesUsd: 0, otHours: 0, hourlyRateUsd: 0, finalPayDaysLate: 10, dailyRateUsd: 224 });
ok(caWage10.statePenalty === 2240, 'CA § 203: 10 days late → 10 days’ wages');

/* --- watchlist math --- */
const apple = SETTLEMENTS.find(s => s.id === 'apple-intelligence-iphone-16-2026');
if (!apple) throw new Error('registry missing the verified Apple entry');
ok(SETTLEMENTS.every(s => s.status === 'open'), 'settlement registry: ships only fetch-verified open entries');
ok(daysUntil('2026-12-21', NOW) === 25, 'Apple settlement: 25 days left on 2026-11-26');
ok(settlementStatus(apple, NOW) === 'open', 'Apple settlement renders OPEN today');
ok(settlementStatus(apple, new Date('2027-01-01T00:00:00Z')) === 'expired', 'Apple settlement renders EXPIRED after deadline (never claimable)');

/* --- letter generator --- */
const letter = depositLetter({ state: 'TX', depositUsd: 1000, withheldUsd: 1000, vacatedOn: '2026-09-01', forwardingAddressGiven: true, landlordName: 'Mr. Landlord', propertyAddress: '1 Test Ave', yourAddress: '2 You St', yourName: 'You' });
ok(letter.includes('92.109') && letter.includes('$4100'), 'TX letter cites statute + $100 + 3× demand (1000+100+3000)');
const letterNY = depositLetter({ state: 'NY', depositUsd: 2000, withheldUsd: 2000, vacatedOn: '2026-10-01', forwardingAddressGiven: true, landlordName: 'LL', propertyAddress: '9 Flat St', yourAddress: '1 You St', yourName: 'You' });
ok(letterNY.includes('§ 7-108(1-a)(e)'), 'NY letter cites § 7-108(1-a)(e)');

console.log(failures === 0 ? '\npackets engine: all assertions passed' : `\npackets engine: ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
