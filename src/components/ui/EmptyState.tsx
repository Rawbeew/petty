/* Empty/Unavailable state — first-class citizen (P1 · P6).
   Icon + what happened + what to do next. Never a dead end. */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="p-6 text-center" role="status">
      <Icon size={30} className="mx-auto text-[var(--dim)]" strokeWidth={1.4} aria-hidden />
      <p className="text-sm text-[var(--ink)] mt-3">{title}</p>
      {children !== undefined && <div className="text-[11px] text-[var(--dim)] mt-1.5 max-w-md mx-auto leading-relaxed">{children}</div>}
    </div>
  );
}
