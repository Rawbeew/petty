/* Persistent legal frame — information, not advice; provenance; version. */
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import TermsModal from './TermsModal';
import { getPlan } from '../config/billing';

export default function ComplianceStrip() {
  const [termsOpen, setTermsOpen] = useState(false);
  const plan = getPlan(); /* render-time read: localStorage, no effect */
  return (
    <>
      <footer className="relative z-10 flex h-auto min-h-7 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 sm:px-5 border-t border-[var(--line)] bg-[#070910] text-[8px] mono text-[#5b6280] py-1">
        <span className="flex items-center gap-1.5 min-w-0"><ShieldCheck size={9} className="text-[var(--green)]" aria-hidden /><span className="truncate">INFORMATION, NOT ADVICE · VERIFY AT THE LINKED SOURCE · NOT AFFILIATED WITH ANY AGENCY</span></span>
        <span className="flex items-center gap-3 shrink-0">
          {plan === 'household' && <span className="chip chip-gold !text-[7px]">HOUSEHOLD</span>}
          <span className="hidden sm:inline">PETTY v2.3.0 · open-government data, attributed</span>
          <button onClick={() => { setTermsOpen(true); }} className="underline underline-offset-2 hover:text-[var(--ink)] transition-colors" aria-haspopup="dialog">TERMS &amp; HONESTY</button>
        </span>
      </footer>
      {termsOpen && <TermsModal onClose={() => { setTermsOpen(false); }} />}
    </>
  );
}
