import assert from 'node:assert/strict';
import { usDotFeeRefundEligible, eu261, apprLargeCarrier, montrealNotice, MONTREAL_CAP_SDR, USD_PER_SDR_CAP, assessLuggage, namePermutations, addressPermutations, claimTargets } from '../src/statutes';

// US DOT boundary math (12h domestic / 15h intl<=12h / 30h intl>12h)
assert.equal(usDotFeeRefundEligible({ route: 'us_domestic', delayHours: 11.99 }).eligible, false);
assert.equal(usDotFeeRefundEligible({ route: 'us_domestic', delayHours: 12 }).eligible, true);
assert.equal(usDotFeeRefundEligible({ route: 'us_international_le12', delayHours: 14.99 }).eligible, false);
assert.equal(usDotFeeRefundEligible({ route: 'us_international_le12', delayHours: 15 }).eligible, true);
assert.equal(usDotFeeRefundEligible({ route: 'us_international_gt12', delayHours: 29.99 }).eligible, false);
assert.equal(usDotFeeRefundEligible({ route: 'us_international_gt12', delayHours: 30 }).eligible, true);
assert.equal(usDotFeeRefundEligible({ route: 'us_domestic', delayHours: 12 }).threshold, 12);

// EU261 tiers: 250 / 400 / 600
assert.equal(eu261(1200).euros, 250);
assert.equal(eu261(2000).euros, 400);
assert.equal(eu261(6000).euros, 600);
assert.equal(eu261(1500).euros, 250);
assert.equal(eu261(3500).euros, 400);

// CTA APPR large-carrier: 0 / 400 / 700 / 1000 CAD
assert.deepEqual([apprLargeCarrier(2.9).cad, apprLargeCarrier(3).cad, apprLargeCarrier(6).cad, apprLargeCarrier(9).cad], [0, 400, 700, 1000]);

// Montreal windows + cap
assert.equal(montrealNotice('damaged').days, 7);
assert.equal(montrealNotice('delayed').days, 21);
assert.equal(MONTREAL_CAP_SDR, 1519);
assert.equal(USD_PER_SDR_CAP, Math.round(1519 * 1.31));

// Full assessment composes (US domestic, delayed, 13h late, € — defaults)
const a = assessLuggage({ route: 'us_domestic', distanceKm: 900, delayHours: 13, flightHours: 5, arrivalDelayHours: 0, interimExpensesUsd: 140, damaged: false, delayed: true, airline: 'TestAir', pnr: 'X7KQ2L' });
assert.equal(a.feeRefund?.eligible, true);
assert.equal(a.euComp, null);
assert.ok(a.checklist.length >= 5);
assert.ok(a.headline.includes('12h'));

// EU route assessment
const b = assessLuggage({ route: 'eu', distanceKm: 2200, delayHours: 4, flightHours: 3, arrivalDelayHours: 3.5, interimExpensesUsd: 100, damaged: false, delayed: true, airline: 'EuroAir', pnr: 'P1' });
assert.equal(b.feeRefund, null);
if (b.euComp === null) throw new Error('euComp missing for EU route');
assert.equal(b.euComp.euros, 400);
assert.equal(b.euComp.payable, true);

// Permutations
const n = namePermutations('Ada', 'Okafor', 'Bello');
assert.ok(n.length >= 10 && n.length <= 32, `name permutations: ${n.length}`);
assert.ok(n.includes('Ada Okafor'));
assert.ok(n.includes('Okafor, Ada'));
assert.ok(n.some(x => x.startsWith('A. Okafor')));
const ad = addressPermutations('14 Harbour View Road', 'Ibadan', '200285');
assert.ok(ad.length >= 4 && ad.some(x => x.includes('14 Harbour View Road')));

// Claim targets respect market gating
assert.ok(claimTargets(['US']).every(t => t.market === 'US'));
assert.equal(claimTargets(['US', 'UK', 'CA', 'AU']).length, 8);
assert.equal(claimTargets(['GL']).length, 0);

console.log('statutes engine: all assertions passed');
