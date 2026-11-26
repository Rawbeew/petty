/* Composition root — Petty.
   Structure: ambient layers → skip link → Navbar → statutory Ticker → view → legal frame.
   Each view owns exactly one job (P2). State lives at the leaves; composition here is static. */
import { useState } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import Navbar from './components/Navbar';
import Ticker from './components/Ticker';
import ComplianceStrip from './components/ComplianceStrip';
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

export default function App() {
  const [packCode, setPackCode] = useState('US');
  const [view, setView] = useState<ViewId>('radar');
  const pack = COUNTRY_PACKS.find(p => p.code === packCode) ?? US_PACK;

  return (
    <LazyMotion features={domAnimation} strict>
    <div className="relative h-screen flex flex-col overflow-hidden bg-[var(--bg)]">
      {/* ambient layers — purely visual, screen-reader invisible */}
      <div aria-hidden className="aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 noise" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-drift" />

      <a href="#main" className="skip-link">Skip to content</a>

      <Navbar packs={COUNTRY_PACKS} active={pack} onPack={p => { setPackCode(p.code); }} view={view} onView={setView} />
      <Ticker />

      <main id="main" className="relative flex-1 min-h-0" tabIndex={-1}>
        {view === 'radar' && <RadarView pack={pack} />}
        {view === 'guard' && <GuardView pack={pack} />}
        {view === 'recover' && <RecoverView pack={pack} />}
        {view === 'vault' && <VaultView pack={pack} />}
      </main>

      <ComplianceStrip />
    </div>
    </LazyMotion>
  );
}
