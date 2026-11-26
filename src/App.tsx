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
import ErrorBoundary from './components/ErrorBoundary';
import { CaseProvider } from './components/CaseProvider';
import { setPlan, BILLING } from './config/billing';
import { COUNTRY_PACKS } from './data/packs';
import type { CountryPack } from './data/packs';

export type ViewId = 'radar' | 'guard' | 'recover' | 'vault';

const US_PACK: CountryPack = COUNTRY_PACKS.find(p => p.code === 'US') ?? {
  code: 'US', name: 'United States', tier: 'launch', flag: '🇺🇸', currency: 'USD', ppp: null, regulators: [],
};

export default function App() {
  const [packCode, setPackCode] = useState('US');
  /* Stripe Payment Link success URL lands as ?billing=household — captured in the
     initializer (before first paint): self-reported, on-device, no server involved. */
  const [justJoined, setJustJoined] = useState(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('billing') !== 'household') return false;
    setPlan('household');
    url.searchParams.delete('billing');
    window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ''));
    return true;
  });
  const [view, setView] = useState<ViewId>('radar');
  const pack = COUNTRY_PACKS.find(p => p.code === packCode) ?? US_PACK;

  return (
    <LazyMotion features={domAnimation} strict>
    <CaseProvider goComplaint={() => { setView('recover'); }}>
    <div className="relative h-screen flex flex-col overflow-hidden bg-[var(--bg)]">
      {/* ambient layers — purely visual, screen-reader invisible */}
      <div aria-hidden className="aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 noise" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-drift" />

      <a href="#main" className="skip-link">Skip to content</a>

      <Navbar packs={COUNTRY_PACKS} active={pack} onPack={p => { setPackCode(p.code); }} view={view} onView={setView} />
      <Ticker />
      {justJoined && (
        <div role="status" className="relative z-10 flex items-center justify-center gap-3 border-b border-[rgba(242,193,78,0.35)] bg-[rgba(242,193,78,0.12)] px-4 py-1.5 text-[11px] text-[var(--gold)]">
          <span>Welcome to {BILLING.planName} — recorded on this device. Manage or cancel anytime via the Stripe portal.</span>
          <button onClick={() => { setJustJoined(false); }} className="mono text-[9px] underline underline-offset-2 hover:text-[var(--ink)]" aria-label="Dismiss">Dismiss</button>
        </div>
      )}

      <main id="main" className="relative flex-1 min-h-0" tabIndex={-1}>
        <ErrorBoundary key={view} label={view === 'guard' ? 'Receipts' : view === 'recover' ? 'Comeuppance' : view === 'vault' ? 'The Black Book' : 'Side-Eye'}>
          {view === 'radar' && <RadarView pack={pack} />}
          {view === 'guard' && <GuardView pack={pack} />}
          {view === 'recover' && <RecoverView pack={pack} />}
          {view === 'vault' && <VaultView pack={pack} />}
        </ErrorBoundary>
      </main>

      <ComplianceStrip />
    </div>
    </CaseProvider>
    </LazyMotion>
  );
}
