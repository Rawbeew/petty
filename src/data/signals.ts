/* Petty — shared signal types. NO seed/demo data exists in this build:
 * every rendered signal originates from a live, attributed open-government source
 * or is absent (citation-or-silence). The single vocabulary the whole app speaks —
 * a signal that cannot name its source cannot exist. */

export type Pillar = 'health' | 'weather' | 'dispatch' | 'stops' | 'courts' | 'money' | 'luggage';
export type Confidence = 'verified_agency' | 'anonymized_approx' | 'unconfirmed_dispatch';

export interface SafetySignal {
  id: string; pillar: Pillar; title: string; agency: string; country: string;
  severity: 'critical' | 'high' | 'moderate' | 'watch';
  confidence: Confidence; lat: number; lng: number; publishedAt: string;
  summary: string; rawOfficialText: string; sourceUrl: string; tags: string[];
}
