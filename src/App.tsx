import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Navbar from './components/Navbar';
import RadarView from './components/RadarView';
import GuardView from './components/GuardView';
import RecoverView from './components/RecoverView';
import VaultView from './components/VaultView';
import { COUNTRY_PACKS } from './data/packs';
import type { CountryPack } from './data/packs';

export type ViewId = 'radar' | 'guard' | 'recover' | 'vault';

const US_PACK: CountryPack = COUNTRY_PACKS.find(p => p.code === 'US') ?? {
  code: 'US', name: 'United States', tier: 'launch', flag: '🇺🇸', currency: 'USD', ppp: null, regulators: [],
};

/* Statutory facts — not news, not demo. Each is verifiable in the source instrument. */
const TICKER_FACTS = [
  '14 CFR Part 254 — checked-bag fees auto-refund at 12h (domestic) · 15h (intl ≤12h) · 30h (intl >12h)',
  'Montreal 1999 — 1,519 SDR cap · written notice: 7 days damage · 21 days delay',
  'EU261/UK261 — €250 / €400 / €600 fixed compensation by distance band',
  'CTA APPR — C$400 / C$700 / C$1,000 large-carrier delay & denial schedule',
  'YMYL — citation-or-silence · Petty never sells finder’s fees, only flat subscriptions',
].join('   ·   ');

export default function App() {
  const [packCode, setPackCode] = useState('US');
  const [view, setView] = useState<ViewId>('radar');
  const pack = COUNTRY_PACKS.find(p => p.code === packCode) ?? US_PACK;

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-[var(--bg)]">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 noise" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[900px] rounded-full" style={{ background: 'radial-gradient(ellipse at center, rgba(242,193,78,0.07), transparent 65%)' }} />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -left-40 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(89,213,240,0.05), transparent 70%)' }} />

      <Navbar packs={COUNTRY_PACKS} active={pack} onPack={p => { setPackCode(p.code); }} view={view} onView={setView} />

      {/* statutory ticker — law, not headlines */}
      <div className="relative z-10 border-b border-[var(--line)] bg-[#080a10] h-8 overflow-hidden flex items-center">
        <div className="marquee mono text-[9px] tracking-[0.12em] text-[#a9b0c8] pl-4">
          <span>{TICKER_FACTS}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;</span><span>{TICKER_FACTS}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>

      {/* active view */}
      <main className="relative flex-1 min-h-0">
        {view === 'radar' && <RadarView pack={pack} />}
        {view === 'guard' && <GuardView pack={pack} />}
        {view === 'recover' && <RecoverView pack={pack} />}
        {view === 'vault' && <VaultView pack={pack} />}
      </main>

      {/* compliance footer strip */}
      <footer className="relative z-10 hidden md:flex h-7 items-center justify-between px-5 border-t border-[var(--line)] bg-[#070910] text-[8px] mono text-[#5b6280]">
        <span className="flex items-center gap-1.5"><ShieldCheck size={9} className="text-[var(--green)]" />INFORMATION, NOT ADVICE · VERIFY AT THE LINKED SOURCE · NOT AFFILIATED WITH ANY AGENCY</span>
        <span>PETTY RADAR v2.0 · petty.io · open-government data, attributed</span>
      </footer>
    </div>
  );
}
