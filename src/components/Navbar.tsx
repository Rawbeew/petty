import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, Receipt, Gavel, BookLock, Check, UserRound } from 'lucide-react';
import type { CountryPack } from '../data/packs';
import type { ViewId } from '../App';
import { cx } from '../lib/ui';
import { isSupabaseConfigured } from '../lib/supabase';
import AccountModal from './AccountModal';
import { m } from 'motion/react';

const VIEWS: { id: ViewId; label: string; icon: typeof Eye; title: string }[] = [
  { id: 'radar', label: 'Side-Eye', icon: Eye, title: 'The Side-Eye — the agencies, watched' },
  { id: 'guard', label: 'Receipts', icon: Receipt, title: 'The Receipts — recalls, dockets, incidents on record' },
  { id: 'recover', label: 'Comeuppance', icon: Gavel, title: 'The Comeuppance — statutory money, yours by right' },
  { id: 'vault', label: 'Black Book', icon: BookLock, title: 'The Black Book — every regulator, audited and dated' },

];

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="#0b0e14" stroke="#F2C14E" strokeOpacity="0.35" strokeWidth="1.6" />
        <path d="M20 20 L20 3.5 A16.5 16.5 0 0 1 33 11 Z" fill="#F2C14E" fillOpacity="0.85" />
        <circle cx="20" cy="20" r="2.6" fill="#F2C14E" />
        <circle cx="26.5" cy="13.5" r="1.6" fill="#59d5f0" />
      </svg>
      <div className="leading-none">
        <div className="font-display text-[19px] tracking-[0.3em] text-[var(--ink)]">PETTY</div>
        <div className="mono text-[7px] tracking-[0.28em] text-[var(--gold)] mt-1">LAWFUL REVENGE · DELIVERED</div>
      </div>
    </div>
  );
}

export default function Navbar({ packs, active, onPack, view, onView }: {
  packs: CountryPack[]; active: CountryPack; onPack: (p: CountryPack) => void; view: ViewId; onView: (v: ViewId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target instanceof Node) || !ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <header className="relative z-40 border-b border-[var(--line)] bg-[rgba(6,8,13,0.85)] backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
        <Wordmark />

        {/* Country-pack selector */}
        <div className="relative" ref={ref}>
          <button onClick={() => { setOpen(o => !o); }} aria-haspopup="listbox" aria-expanded={open}
            className="flex items-center gap-2.5 rounded-xl border border-[var(--line2)] bg-[var(--panel)] hover:border-[rgba(242,193,78,0.45)] transition-colors pl-3 pr-2.5 py-2">
            <span className="text-lg leading-none">{active.flag}</span>
            <span className="hidden sm:block text-left leading-tight">
              <span className="block text-[11px] font-semibold text-[var(--ink)]">{active.name}</span>
              <span className="block mono text-[8px] text-[var(--dim)] tracking-[0.2em]">LAUNCH RING</span>
            </span>
            <ChevronDown size={14} className={cx('text-[var(--dim)] transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <div role="listbox" className="absolute right-0 sm:left-0 sm:right-auto top-[calc(100%+8px)] w-[300px] panel-flat shadow-2xl shadow-black/60 p-1.5 max-h-[70vh] overflow-auto">
              <div className="px-2.5 pt-2 pb-1 mono text-[9px] tracking-[0.25em] text-[var(--dim)]">LAUNCH RING</div>
              {packs.map(p => (
                <button key={p.code} role="option" aria-selected={p.code === active.code} onClick={() => { onPack(p); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[var(--panel2)] text-left">
                  <span className="text-base">{p.flag}</span>
                  <span className="flex-1 text-[12px] text-[var(--ink)]">{p.name}
                    <span className="block mono text-[8px] text-[var(--dim)]">{p.currency} · {p.regulators.length} feeds</span>
                  </span>
                  {p.code === active.code && <Check size={14} className="text-[var(--gold)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop view nav */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1">
          {VIEWS.map(v => (
            <button key={v.id} title={v.title} onClick={() => { onView(v.id); }} aria-current={view === v.id ? 'page' : undefined}
              className={cx('relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] mono tracking-[0.14em] uppercase transition-colors duration-200',
                view === v.id ? 'text-black font-bold' : 'text-[var(--dim)] hover:text-[var(--ink)]')}>
              {view === v.id && <m.span layoutId="nav-active-pill" className="absolute inset-0 rounded-lg bg-[var(--gold)]" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />}
              <span className="relative flex items-center gap-2"><v.icon size={13} strokeWidth={view === v.id ? 2.5 : 1.8} />{v.label}</span>
            </button>
          ))}
        </nav>

        {isSupabaseConfigured() && (
          <button onClick={() => { setAccountOpen(true); }} aria-label="Open account" title="Optional account — sign in with magic link" className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--line2)] text-[var(--dim)] hover:text-[var(--ink)] hover:border-[var(--gold)] transition-colors px-3 py-2">
            <UserRound size={14} /><span className="mono text-[8px] tracking-[0.2em] uppercase">Account</span>
          </button>
        )}
      </div>
      {accountOpen && <AccountModal onClose={() => { setAccountOpen(false); }} />}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--line)] bg-[rgba(6,8,13,0.94)] backdrop-blur-lg">
        <div className="grid grid-cols-4 h-16">
          {VIEWS.map(v => (
            <button key={v.id} title={v.title} onClick={() => { onView(v.id); }} aria-current={view === v.id ? 'page' : undefined} className="flex flex-col items-center justify-center gap-0.5">
              <v.icon size={18} className={cx(view === v.id ? 'text-[var(--gold)]' : 'text-[var(--dim)]')} />
              <span className={cx('mono text-[8px] tracking-[0.18em] uppercase', view === v.id ? 'text-[var(--gold)]' : 'text-[var(--dim)]')}>{v.label.replace('Country ', '')}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
