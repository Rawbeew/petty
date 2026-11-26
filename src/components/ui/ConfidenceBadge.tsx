/* ConfidenceBadge — provenance, type-level enforced (P1). */
import { BadgeCheck, CircleAlert, Info } from 'lucide-react';
import { cx, CONFIDENCE_META } from '../../lib/ui';
import type { Confidence } from '../../data/signals';

export function ConfidenceBadge({ c }: { c: Confidence }) {
  const m = CONFIDENCE_META[c];
  const I = c === 'verified_agency' ? BadgeCheck : c === 'anonymized_approx' ? Info : CircleAlert;
  return (
    <span className={cx('chip', m.cls)} title={m.note}>
      <I size={11} aria-hidden />{m.label}
    </span>
  );
}
