/* Petty — pipeline: the eligibility gate drops before the UI ever sees it. */
import { signalEligibility, partitionEligible } from '../src/lib/pipeline';
import type { SafetySignal } from '../src/data/signals';

let failures = 0;
const ok = (cond: boolean, label: string) => { console.log((cond ? 'PASS' : 'FAIL'), '-', label); if (!cond) failures++; };

const good: SafetySignal = {
  id: 'x1', pillar: 'health', title: 'Recall', agency: 'FDA', country: 'US',
  severity: 'high', confidence: 'verified_agency', lat: 44, lng: -93,
  publishedAt: '2026-11-25T00:00:00Z', summary: 's', rawOfficialText: 'r',
  sourceUrl: 'https://www.fda.gov/safety', tags: [],
};

/* Simulates hostile/dirty wire data — the gate exists for exactly this. */
const corrupt = (patch: Record<string, unknown>): SafetySignal => Object.assign({ ...good }, patch);

ok(signalEligibility(good).eligible, 'well-formed live signal is eligible');
ok(!signalEligibility(corrupt({ sourceUrl: '' })).eligible, 'missing sourceUrl is ineligible');
ok(!signalEligibility(corrupt({ sourceUrl: 'http://www.fda.gov/safety' })).eligible, 'http (not https) source is ineligible');
ok(!signalEligibility(corrupt({ sourceUrl: 'not a url' })).eligible, 'unparseable sourceUrl is ineligible');
ok(!signalEligibility(corrupt({ publishedAt: 'yesterday' })).eligible, 'unparseable date is ineligible');
ok(!signalEligibility(corrupt({ rawOfficialText: '', summary: '' })).eligible, 'no text at all is ineligible');
ok(!signalEligibility(corrupt({ confidence: 'probable' })).eligible, 'unknown confidence class is ineligible');
ok(!signalEligibility(corrupt({ severity: 'existential' })).eligible, 'unknown severity class is ineligible');
ok(!signalEligibility(corrupt({ lat: 999 })).eligible, 'coordinates out of range are ineligible');

const part = partitionEligible([good, corrupt({ id: 'x2', sourceUrl: '' }), { ...good, id: 'x3' }]);
ok(part.eligible.length === 2 && part.withheld === 1, 'partition keeps eligible, counts withheld');

console.log(failures === 0 ? '\npipeline: all assertions passed' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
