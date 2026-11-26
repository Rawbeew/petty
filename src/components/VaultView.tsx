import { Fragment } from 'react';
import { BookLock, ExternalLink, ShieldCheck, BadgeDollarSign, Sparkles, Code2 } from 'lucide-react';
import { COUNTRY_PACKS } from '../data/packs';
import { BILLING, isBillingConfigured, getPlan } from '../config/billing';
import type { CountryPack } from '../data/packs';
import { cx } from '../lib/ui';
import TariffWatch from './TariffWatch';

const LICENSE_STYLE: Record<string, { label: string; cls: string }> = {
  public_domain: { label: 'PUBLIC DOMAIN', cls: 'chip-green' },
  api: { label: 'API + LICENSE', cls: 'chip-cyan' },
  license_gated: { label: 'LICENSE-GATED', cls: 'chip-gold' },
  fee: { label: 'FEE', cls: 'chip-red' },
};
const STATUS_DOT: Record<string, string> = { wired: '#3ddc97', portal: '#59d5f0', 'bot-walled': '#f2c14e', unverifiable: '#ff5a5a', gated: '#8a8fa3', queued: '#f2c14e' };
const STATUS_LABEL: Record<string, string> = { wired: 'WIRED LIVE', portal: 'PORTAL · 200 OK', 'bot-walled': 'BOT-WALLED', unverifiable: 'UNVERIFIABLE', gated: 'GATED', queued: 'QUEUED' };
const AUDIT = 'Audit 2026-11-26';

function RegistryTable({ pack }: { pack: CountryPack }) {
  const glPack = COUNTRY_PACKS.find(p => p.code === 'GL');
  const rows = [...pack.regulators, ...(glPack ? glPack.regulators.map(r => ({ ...r, name: `GL · ${r.name}` })) : [])];
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-wrap gap-2">
        <div>
          <div className="mono text-[9px] tracking-[0.3em] text-[var(--gold)] flex items-center gap-2"><BookLock size={11} />THE BLACK BOOK</div>
          <h2 className="font-display text-lg mt-1">{pack.flag} {pack.name} — regulator registry</h2>
        </div>
        <span className="mono text-[9px] text-[var(--dim)]">{rows.length} FEEDS · EVERY URL {AUDIT.toUpperCase()} · RE-VERIFY AT SOURCE</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-y border-[var(--line)] text-[var(--dim)] mono text-[8px] tracking-[0.2em]">
              <th className="px-5 py-2 font-medium">FEED</th><th className="px-3 py-2 font-medium">PILLAR</th><th className="px-3 py-2 font-medium">CADENCE</th><th className="px-3 py-2 font-medium">LICENSE</th><th className="px-3 py-2 font-medium">STATUS</th><th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((r, i) => (
              <Fragment key={i}>
                <tr className="hover:bg-[var(--panel2)] transition-colors">
                  <td className="px-5 py-2.5 text-[var(--ink)] max-w-[300px]">{r.name}</td>
                  <td className="px-3 py-2.5 mono text-[9px] text-[var(--dim)] uppercase">{r.pillar}</td>
                  <td className="px-3 py-2.5 mono text-[9px] text-[var(--dim)] uppercase">{r.cadence}</td>
                  <td className="px-3 py-2.5"><span className={cx('chip', LICENSE_STYLE[r.license]?.cls ?? 'chip-cyan')}>{LICENSE_STYLE[r.license]?.label ?? r.license}</span></td>
                  <td className="px-3 py-2.5"><span className="flex items-center gap-1.5 mono text-[9px] uppercase" style={{ color: STATUS_DOT[r.status] }}><span className="dot" style={{ background: STATUS_DOT[r.status] }} />{STATUS_LABEL[r.status] ?? r.status}</span></td>
                  <td className="px-3 py-2.5 text-right">
                    <a href={r.url} target="_blank" rel="noreferrer" title={`Portal: ${r.url}`} aria-label={`Open ${r.name} portal`} className="inline-flex p-1.5 rounded-lg text-[var(--dim)] hover:text-[var(--cyan)]"><ExternalLink size={13} /></a>
                    {r.wireUrl !== undefined && <a href={r.wireUrl} target="_blank" rel="noreferrer" title={`Wired feed: ${r.wireUrl}`} aria-label={`Open ${r.name} machine feed`} className="inline-flex p-1.5 rounded-lg text-[var(--dim)] hover:text-[var(--green)]"><Code2 size={13} /></a>}
                  </td>
                </tr>
                {r.note !== undefined && <tr className="bg-[rgba(255,255,255,0.015)]"><td colSpan={6} className="px-5 pb-2 -mt-1 mono text-[8px] text-[var(--dim)] leading-relaxed">└ {r.note}</td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-[var(--line)] flex flex-wrap gap-x-6 gap-y-1.5 mono text-[8px] text-[var(--dim)]">
        <span>◦ audit: 9 wired live (openFDA · CPSC · NWS · NYPD · FSA · Find Case Law · ECCC · police.uk ×2 · WHO)</span>
        <span>◦ portal = 200 OK, not embedded · bot-walled = 403 to scripts, fine in browsers · unverifiable = no route from build network</span>
        <span>◦ dead links found + fixed 2026-11-26: weather.gov/cap · BOM warnings · bona-vacantia · uscourts UCF · treasuryhunt · BoC · CAA · police.uk stops</span>
        <span>◦ full log: reports/link-audit-2026-11-26.md — re-run: scripts/verify_links.py</span>
      </div>
    </section>
  );
}

function Pricing({ pack }: { pack: CountryPack }) {
  const configured = isBillingConfigured();
  const plan = getPlan();
  return (
    <section>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="mono text-[9px] tracking-[0.3em] text-[var(--dim)] flex items-center gap-2"><BadgeDollarSign size={11} />FLAT — NEVER A PERCENTAGE FINDER’S FEE</div>
          <h3 className="font-display text-lg mt-1">{plan === 'household' ? 'The Household — you are on it. Thank you.' : 'The Household — one flat price, six seats'}</h3>
        </div>
        <span className="mono text-[8px] text-[var(--dim)]">PRICED IN {pack.currency === 'USD' ? 'USD' : 'USD'} · FLAT</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="glow-card p-5 flex flex-col">
          <div className="mono text-[10px] tracking-[0.25em] text-[var(--dim)]">THE FREE LAW — FOREVER</div>
          <div className="mt-2 font-display text-4xl text-[var(--ink)]">$0</div>
          <ul className="mt-3 space-y-1.5 text-[11.5px] text-[#c9cddb] flex-1">
            <li><span className="text-[var(--green)]">✓</span> Every statute engine — baggage, deposit, wages, settlements</li>
            <li><span className="text-[var(--green)]">✓</span> Every live wire + letter pack + print/PDF</li>
            <li><span className="text-[var(--green)]">✓</span> Pantry, case file, evidence photos — on-device</li>
            <li><span className="text-[var(--green)]">✓</span> Clockwatch — up to {5} open clocks</li>
          </ul>
          <p className="mono text-[8px] text-[var(--dim)] mt-3">Law is never paywalled. Statute engines don’t take subscriptions; neither do we.</p>
        </div>
        <div className="glow-card card-hover p-5 flex flex-col border-beam relative">
          <span className="absolute top-3 right-3 chip chip-gold"><Sparkles size={10} />FOUNDING PRICE</span>
          <div className="mono text-[10px] tracking-[0.25em] text-[var(--gold)]">THE HOUSEHOLD — $9/MO · $79/YR</div>
          <div className="mt-2 flex items-end gap-2"><span className="font-display text-4xl text-[var(--ink)]">$9</span><span className="mono text-[10px] text-[var(--dim)] mb-1.5">/mo</span><span className="mono text-[9px] text-[var(--cyan)] mb-1.5">or $79/yr (save $29)</span></div>
          <ul className="mt-3 space-y-1.5 text-[11.5px] text-[#c9cddb] flex-1">
            <li><span className="text-[var(--green)]">✓</span> 6 seats — your household on one flat plan</li>
            <li><span className="text-[var(--green)]">✓</span> Unlimited Clockwatch deadlines</li>
            <li><span className="text-[var(--green)]">✓</span> Founding price locked for life</li>
            <li><span className="text-[var(--green)]">✓</span> Funds the free law part for everyone</li>
          </ul>
          {configured ? (
            <div className="mt-4 space-y-2">
              <a href={BILLING.monthlyLink} target="_blank" rel="noreferrer" className="block w-full text-center rounded-xl bg-[var(--gold)] text-black font-bold py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)] transition-colors">Subscribe — $9/mo</a>
              <a href={BILLING.annualLink} target="_blank" rel="noreferrer" className="block w-full text-center rounded-xl border border-[var(--gold)] text-[var(--gold)] py-2 mono text-[9px] tracking-[0.2em] uppercase hover:bg-[rgba(242,193,78,0.1)] transition-colors">Subscribe — $79/yr</a>
              {BILLING.portalLink && <a href={BILLING.portalLink} target="_blank" rel="noreferrer" className="block text-center mono text-[8px] text-[var(--dim)] hover:text-[var(--ink)] underline underline-offset-2 transition-colors">Manage or cancel (Stripe portal)</a>}
            </div>
          ) : (
            <p className="mono text-[8px] text-[var(--dim)] mt-4 border border-dashed border-[var(--line2)] rounded-xl px-3 py-2.5 leading-relaxed">NOT CHARGING YET — THIS BUILD HAS NO STRIPE LINKS. WHEN BILLING OPENS: one announcement, a 30-day free trial, cancel in one tap via the Stripe portal, and founding pricing locked forever. Watch the repo for the launch.</p>
          )}
          <p className="mono text-[7.5px] text-[var(--dim)] mt-2 opacity-80">Entitlement is honor-system: this build records your subscription on-device only. No accounts, no servers — your word is the license.</p>
        </div>
      </div>
    </section>
  );
}

export default function VaultView({ pack }: { pack: CountryPack }) {
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-6">
      <div className="p-3 sm:p-5 space-y-5">
        <RegistryTable pack={pack} />
        <TariffWatch />
        <Pricing pack={pack} />
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mono text-[8px] text-[var(--dim)] border-t border-[var(--line)] pt-4">
          <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-[var(--green)]" />citation-or-silence</span>
          <span>◦ K-anonymity ≥25 stops/cell</span>
          <span>◦ no live audio — recorded transmissions only</span>
          <span>◦ ZDR-preferred providers; public text only to free models</span>
          <span>◦ no percentage finder’s fees</span>
          <span>◦ open government data, attributed</span>
        </div>
      </div>
    </div>
  );
}
