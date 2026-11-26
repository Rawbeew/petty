import { Fragment } from 'react';
import { BookLock, ExternalLink, ShieldCheck, BadgeDollarSign, Sparkles, Code2 } from 'lucide-react';
import { COUNTRY_PACKS } from '../data/packs';
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
  return (
    <section>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="mono text-[9px] tracking-[0.3em] text-[var(--dim)] flex items-center gap-2"><BadgeDollarSign size={11} />FLAT SUBSCRIPTIONS — NO PERCENTAGE FINDER’S FEES, EVER</div>
          <h3 className="font-display text-lg mt-1">Free while we launch — flat when billing opens</h3>
        </div>
        <span className="mono text-[8px] text-[var(--dim)]">PRICED IN {pack.currency} WHEN LIVE</span>
      </div>
      <div className="glow-card p-5 sm:p-6">
        <p className="text-[12.5px] leading-relaxed text-[#c9cddb] max-w-2xl">
          Every Petty engine is free right now — the statute calculators, live wires, letter packs, the Clockwatch,
          the complaint desk and this registry. When billing opens it will be a <strong className="text-[var(--ink)]">flat subscription — never a percentage of your recovery, never a success fee</strong> —
          and early users keep the launch price for as long as they stay. You will get at least a 30-day free trial and a dated
          announcement before anything is ever charged to you.
        </p>
        <ul className="mt-3 space-y-1.5 text-[11.5px] text-[#c9cddb]">
          <li><span className="text-[var(--green)]">✓</span> The law stays free — statute engines are never paywalled</li>
          <li><span className="text-[var(--green)]">✓</span> No percentage of recoveries — we never touch your money</li>
          <li><span className="text-[var(--green)]">✓</span> Cancel in one tap, keep your on-device data forever</li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href="https://github.com/Rawbeew/petty" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] hover:bg-[rgba(242,193,78,0.1)] transition-colors px-4 py-2.5 mono text-[10px] tracking-[0.2em] uppercase"><Sparkles size={12} />Follow the repo — billing lands there first</a>
          <span className="mono text-[8.5px] text-[var(--dim)]">NOT CHARGING YET — NOTHING YOU TOUCH TODAY ENTAILS PAYMENT</span>
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
