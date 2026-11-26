/* Persistent legal frame — information, not advice; provenance; version. */
import { ShieldCheck } from 'lucide-react';

export default function ComplianceStrip() {
  return (
    <footer className="relative z-10 hidden md:flex h-7 items-center justify-between px-5 border-t border-[var(--line)] bg-[#070910] text-[8px] mono text-[#5b6280]">
      <span className="flex items-center gap-1.5"><ShieldCheck size={9} className="text-[var(--green)]" aria-hidden />INFORMATION, NOT ADVICE · VERIFY AT THE LINKED SOURCE · NOT AFFILIATED WITH ANY AGENCY</span>
      <span>PETTY RADAR v3.0 · petty.io · open-government data, attributed</span>
    </footer>
  );
}
