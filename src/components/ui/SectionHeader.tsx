/* Section header — kicker (mono, gold icon) / display title / optional right slot.
   The canonical panel heading grammar across Petty. */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function SectionHeader({ icon: Icon, kicker, title, right }: { icon: LucideIcon; kicker: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--dim)]">
          <Icon size={12} className="text-[var(--gold)]" aria-hidden /> {kicker}
        </div>
        <h2 className="font-display text-xl text-[var(--ink)] mt-1 leading-tight">{title}</h2>
      </div>
      {right !== undefined && <div className="shrink-0">{right}</div>}
    </div>
  );
}
