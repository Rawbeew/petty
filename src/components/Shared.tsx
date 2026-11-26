import { BadgeCheck, CircleAlert, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cx, CONFIDENCE_META } from '../lib/ui';
import type { Confidence } from '../data/signals';

export function ConfidenceBadge({ c }: { c: Confidence }) {
  const m = CONFIDENCE_META[c];
  return (
    <span className={cx('chip', m.cls)} title={m.note}>
      {c === 'verified_agency' ? <BadgeCheck size={11} /> : c === 'anonymized_approx' ? <Info size={11} /> : <CircleAlert size={11} />}
      {m.label}
    </span>
  );
}

export function SectionHeader({ icon: Icon, kicker, title, right }: { icon: LucideIcon; kicker: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--dim)]">
          <Icon size={12} className="text-[var(--gold)]" /> {kicker}
        </div>
        <h2 className="font-display text-xl text-[var(--ink)] mt-1 leading-tight">{title}</h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

