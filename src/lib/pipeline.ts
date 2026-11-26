/* Petty — the signal pipeline, stage 2: ELIGIBILITY.
 *
 *   retrieve (live.ts) → ELIGIBILITY GATE (this file) → rank in UI → act
 *
 * Eligibility is never a function of prominence: a critical severity cannot
 * outrank a missing source, an unparseable date, or an unknown confidence
 * class. Failing signals are DROPPED and COUNTED — never shown greyed, never
 * retried silently, never "best effort". Citation or silence, as a pipeline
 * stage rather than a promise.
 */
import type { SafetySignal } from '../data/signals';

export interface EligibilityVerdict {
  eligible: boolean;
  reasons: string[];
}

const CONFIDENCES = new Set(['verified_agency', 'anonymized_approx', 'unconfirmed_dispatch']);
const SEVERITIES = new Set(['critical', 'high', 'moderate', 'watch']);

/* Field access without assertions: pull any member as unknown,
   then narrow by typeof — the honest way to vet optimistic types. */
const field = (s: SafetySignal, key: keyof SafetySignal): unknown => s[key];
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown): number => (typeof v === 'number' ? v : NaN);

export function signalEligibility(s: SafetySignal): EligibilityVerdict {
  const reasons: string[] = [];

  if (!str(field(s, 'agency'))) reasons.push('agency missing');
  if (!str(field(s, 'country'))) reasons.push('country missing');
  if (!str(field(s, 'title'))) reasons.push('title missing');
  try {
    const u = new URL(str(field(s, 'sourceUrl')));
    if (u.protocol !== 'https:') reasons.push('sourceUrl is not https');
  } catch {
    reasons.push('sourceUrl unparseable');
  }
  if (!Number.isFinite(Date.parse(str(field(s, 'publishedAt'))))) reasons.push('publishedAt unparseable');
  if (!str(field(s, 'rawOfficialText')) && !str(field(s, 'summary'))) reasons.push('no verifiable text (rawOfficialText and summary empty)');
  const confidence = str(field(s, 'confidence'));
  if (!CONFIDENCES.has(confidence)) reasons.push(`confidence class unknown: ${confidence || '(missing)'}`);
  const severity = str(field(s, 'severity'));
  if (!SEVERITIES.has(severity)) reasons.push(`severity class unknown: ${severity || '(missing)'}`);
  const lat = num(field(s, 'lat'));
  const lng = num(field(s, 'lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) reasons.push('coordinates out of range');

  return { eligible: reasons.length === 0, reasons };
}

export function partitionEligible(signals: SafetySignal[]): { eligible: SafetySignal[]; withheld: number } {
  const eligible: SafetySignal[] = [];
  let withheld = 0;
  for (const s of signals) {
    if (signalEligibility(s).eligible) eligible.push(s); else withheld++;
  }
  return { eligible, withheld };
}
