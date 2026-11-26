import { Fragment } from 'react';
import { Vault, Lock, ExternalLink, ShieldCheck, BadgeDollarSign, Sparkles, Code2 } from 'lucide-react';
import { COUNTRY_PACKS, PHASE2_PACKS, PRICING } from '../data/packs';
import type { CountryPack } from '../data/packs';
import { cx } from '../lib/ui';
import { Reveal } from './ui/Motion';

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
          <div className="mono text-[9px] tracking-[0.3em] text-[var(--gold)] flex items-center gap-2"><Vault size={11} />COUNTRY VAULT</div>
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
          <div className="mono text-[9px] tracking-[0.3em] text-[var(--dim)] flex items-center gap-2"><BadgeDollarSign size={11} />FLAT SUBSCRIPTIONS — NO PERCENTAGE FINDER’S FEES</div>
          <h3 className="font-display text-lg mt-1">Simple, honest pricing in {pack.currency}</h3>
        </div>
        <span className="mono text-[8px] text-[var(--dim)]">PPP localisation = Phase 2 only</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {PRICING.map(p => (
          <Reveal key={p.id} className="h-full">
          <div className={cx('glow-card card-hover p-5 flex flex-col h-full', p.featured && 'border-beam')}>
            {p.featured && <span className="absolute top-3 right-3 chip chip-gold"><Sparkles size={10} />MOST CHOSEN</span>}
            <div className="mono text-[10px] tracking-[0.25em] text-[var(--dim)]">{p.name.toUpperCase()}</div>
            <div className="mt-2 flex items-end gap-1"><span className="font-display text-4xl text-[var(--ink)]">{p.price}</span><span className="mono text-[10px] text-[var(--dim)] mb-1.5">{p.per}</span></div>
            <div className="mono text-[9px] text-[var(--cyan)]">{p.annual}</div>
            <p className="text-[11px] leading-relaxed text-[#c9cddb] mt-3 flex-1">{p.blurb}</p>
            <button className={cx('mt-4 rounded-xl py-2.5 mono text-[10px] tracking-[0.2em] uppercase font-bold', p.featured ? 'bg-[var(--gold)] text-black hover:bg-[var(--gold2)]' : 'border border-[var(--line2)] text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)]')}>{p.cta}</button>
          </div>
          </Reveal>
        ))}
      </div>
      <p className="mono text-[8px] text-[var(--dim)] mt-2">30-day money-back if zero verified signals surface in your radius · Cancel anytime · Petty is not affiliated with any government agency · Information, not advice.</p>
    </section>
  );
}

function Phase2() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Lock size={13} className="text-[var(--dim)]" />
        <h3 className="font-display text-lg text-[var(--dim)]">Expansion Ring — Phase 2 (earned, not assumed)</h3>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {PHASE2_PACKS.map(p => (
          <div key={p.code} className="rounded-xl border border-dashed border-[var(--line2)] p-4 opacity-80">
            <div className="text-xl">{p.flag}</div>
            <div className="mono text-[10px] tracking-[0.2em] mt-1 text-[var(--ink)]">{p.name.toUpperCase()}</div>
            <p className="mono text-[8px] text-[var(--dim)] mt-2 leading-relaxed">{p.gate}</p>
            <div className="mono text-[8px] text-[var(--cyan)] mt-2">UNLOCKS → {p.unlocks.join(' · ')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function VaultView({ pack }: { pack: CountryPack }) {
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-6">
      <div className="p-3 sm:p-5 space-y-5">
        <RegistryTable pack={pack} />
        <Pricing pack={pack} />
        <Phase2 />
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
