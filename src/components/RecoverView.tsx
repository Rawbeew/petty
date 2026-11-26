import { useMemo, useState } from 'react';
import { Landmark, Plane, Download, ListChecks, ShieldCheck, TriangleAlert, FileText } from 'lucide-react';
import type { CountryPack } from '../data/packs';
import { assessLuggage, luggageLetter, namePermutations, addressPermutations, claimTargets, type RouteKind } from '../statutes';
import { SectionHeader } from './ui/SectionHeader';
import { PopVerdict } from './ui/Motion';
import { cx, downloadText } from '../lib/ui';
import DepositPacket from './DepositPacket';
import WagePacket from './WagePacket';
import SettlementWatchlist from './SettlementWatchlist';
import ComplaintDesk from './ComplaintDesk';

function Unclaimed({ pack }: { pack: CountryPack }) {
  const [first, setFirst] = useState('Ada'); const [last, setLast] = useState('Okafor'); const [maiden, setMaiden] = useState('');
  const [street, setStreet] = useState('14 Harbour View Road'); const [city, setCity] = useState('Ibadan'); const [zip, setZip] = useState('200285');
  const names = useMemo(() => (first.trim() && last.trim() ? namePermutations(first, last, maiden || undefined) : []), [first, last, maiden]);
  const addresses = useMemo(() => (street.trim() ? addressPermutations(street, city, zip) : []), [street, city, zip]);
  const MARKET_CODE: Record<string, string> = { US: 'US', GB: 'UK', CA: 'CA', AU: 'AU' };
  const marketKey = pack.code === 'GL' ? 'GL' : (MARKET_CODE[pack.code] ?? pack.code);
  const markets = useMemo(() => (marketKey === 'GL' ? ['US', 'UK', 'CA', 'AU'] : [marketKey]), [marketKey]);
  const targets = useMemo(() => claimTargets(markets), [markets]);

  const packet = () => [
    'PETTY — UNCLAIMED PROPERTY SEARCH PACK (they owe you; do it properly)',
    `Generated: ${new Date().toISOString()} · Market(s): ${markets.join(', ')}`,
    '',
    '== NAME VARIANTS TO SEARCH (exact → phonetic) ==',
    ...names.map((n, i) => `${String(i + 1).padStart(2, ' ')}. ${n}`),
    '',
    '== ADDRESS VARIANTS ==',
    ...addresses.map(a => ` - ${a}`),
    '',
    '== WHERE TO SEARCH (flat-fee advisors ONLY — never % finders) ==',
    ...targets.map(t => ` * ${t.name} — ${t.url}\n     covers: ${t.covers}`),
    '',
    '== RULES THAT KEEP YOU SAFE ==',
    ' - Government finders never take a % at the agency stage; licensed locate services are the only lawful % model.',
    ' - Agency never charges upfront; any "fee to release funds" is a scam.',
    ' - Unclaimed property NEVER expires unclaimed, but holder-to-state windows (3–5 yrs dormancy) do apply — file promptly.',
    ' - Information, not financial advice. Verify matches on official portals only.',
  ].join('\n');

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Landmark} kicker="Unclaimed money" title="Permutation builder" right={<span className="chip chip-gold"><ShieldCheck size={10} />NO FINDER FEES — EVER</span>} />
      <div className="grid grid-cols-2 gap-2.5">
        <div><label className="lbl" htmlFor="fn">First name</label><input id="fn" className="field" value={first} onChange={e => { setFirst(e.target.value); }} /></div>
        <div><label className="lbl" htmlFor="ln">Last name</label><input id="ln" className="field" value={last} onChange={e => { setLast(e.target.value); }} /></div>
        <div className="col-span-2"><label className="lbl" htmlFor="mn">Maiden / former name (optional)</label><input id="mn" className="field" value={maiden} onChange={e => { setMaiden(e.target.value); }} placeholder="maiden, former surname, alias…" /></div>
        <div className="col-span-2"><label className="lbl" htmlFor="st">Last known street</label><input id="st" className="field" value={street} onChange={e => { setStreet(e.target.value); }} /></div>
        <div><label className="lbl" htmlFor="ct">City</label><input id="ct" className="field" value={city} onChange={e => { setCity(e.target.value); }} /></div>
        <div><label className="lbl" htmlFor="zp">Postcode / ZIP</label><input id="zp" className="field" value={zip} onChange={e => { setZip(e.target.value); }} /></div>
      </div>

      <div>
        <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)] mb-1.5">NAME VARIANTS — {names.length}</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">{names.map(n => <span key={n} className="chip">{n}</span>)}{names.length === 0 && <span className="text-[11px] text-[var(--dim)]">Enter names to permute.</span>}</div>
      </div>
      <div>
        <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)] mb-1.5">ADDRESS VARIANTS — {addresses.length}</div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">{addresses.map(a => <span key={a} className="chip">{a}</span>)}</div>
      </div>
      <div>
        <div className="mono text-[9px] tracking-[0.25em] text-[var(--dim)] mb-1.5">WHERE TO SEARCH</div>
        <ul className="space-y-1.5">{targets.map(t => (
          <li key={t.name}><a href={t.url} target="_blank" rel="noreferrer" className="text-[11px] mono text-[var(--cyan)] hover:underline">{t.name} <span className="text-[var(--dim)]">— {t.covers}</span></a></li>
        ))}</ul>
      </div>
      <button onClick={() => { downloadText('petty-claim-pack.txt', packet()); }} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--gold)] text-[var(--gold)] py-3 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[rgba(242,193,78,0.1)]"><Download size={13} />Download claim pack (.txt)</button>
    </section>
  );
}

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--line2)] p-3">
      <div className="mono text-[8px] tracking-[0.22em] text-[var(--dim)]">{label}</div>
      <div className={cx('font-display text-lg mt-1', hot ? 'text-[var(--gold)]' : 'text-[var(--ink)]')}>{value}</div>
    </div>
  );
}

const ROUTES: { id: RouteKind; label: string }[] = [
  { id: 'us_domestic', label: 'US domestic' }, { id: 'us_international_le12', label: 'US intl ≤12h' }, { id: 'us_international_gt12', label: 'US intl >12h' },
  { id: 'eu', label: 'EU departure' }, { id: 'uk', label: 'UK departure' }, { id: 'ca', label: 'Canada (APPR)' }, { id: 'intl', label: 'Other (Montreal only)' },
];

function Luggage() {
  const [f, setF] = useState({
    route: 'us_domestic' as RouteKind, distanceKm: 900, delayHours: 13, flightHours: 5, arrivalDelayHours: 0,
    interimExpensesUsd: 140, damaged: false, delayed: true,
    airline: 'Meridian Air', pnr: 'X7KQ2L', flightNo: 'MA 418', bagTag: '0034 882 117', passengerName: 'Ada Okafor', address: '14 Harbour View Road, Ibadan 200285',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setF(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? (e.target).checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value })); };

  const a = useMemo(() => assessLuggage(f), [f]);
  const letter = () => { downloadText('petty-baggage-demand.txt', luggageLetter(f)); };

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Plane} kicker="Baggage co-pilot" title="Statutory demand engine" right={<span className="chip chip-cyan">MONTREAL · DOT · EU261 · APPR</span>} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <div className="col-span-2 md:col-span-1"><label className="lbl" htmlFor="rt">Route</label>
          <select id="rt" className="field" value={f.route} onChange={set('route')}>{ROUTES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
        <div><label className="lbl" htmlFor="dk">Distance km</label><input id="dk" type="number" className="field" value={f.distanceKm} onChange={set('distanceKm')} /></div>
        <div><label className="lbl" htmlFor="dh">Bag delivery delay (h)</label><input id="dh" type="number" className="field" value={f.delayHours} onChange={set('delayHours')} /></div>
        <div><label className="lbl" htmlFor="fh">Flight hours</label><input id="fh" type="number" step="0.5" className="field" value={f.flightHours} onChange={set('flightHours')} /></div>
        <div><label className="lbl" htmlFor="ad">Arrival delay (h)</label><input id="ad" type="number" step="0.5" className="field" value={f.arrivalDelayHours} onChange={set('arrivalDelayHours')} /></div>
        <div><label className="lbl" htmlFor="ie">Interim expenses (US$)</label><input id="ie" type="number" className="field" value={f.interimExpensesUsd} onChange={set('interimExpensesUsd')} /></div>
        <div className="col-span-2 md:col-span-3 flex gap-4 pt-1">
          <label className="flex items-center gap-2 text-[12px] text-[var(--dim)]"><input type="checkbox" checked={f.damaged} onChange={set('damaged')} className="accent-[#F2C14E] h-4 w-4" />Bag damaged</label>
          <label className="flex items-center gap-2 text-[12px] text-[var(--dim)]"><input type="checkbox" checked={f.delayed} onChange={set('delayed')} className="accent-[#F2C14E] h-4 w-4" />Bag delayed</label>
        </div>
      </div>

      {/* live verdict — announced politely; pops on recompute */}
      <PopVerdict className="rounded-2xl border border-[rgba(242,193,78,0.35)] bg-[rgba(242,193,78,0.06)] p-4" ariaLive="polite">
        <div className="flex items-start gap-2">
          <TriangleAlert size={16} className="text-[var(--gold)] mt-0.5 shrink-0" aria-hidden />
          <p className="font-display text-[15px] text-[#f5e3b3]">{a.headline}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <Stat label="DOT FEE REFUND" value={a.feeRefund ? (a.feeRefund.eligible ? `YES @${a.feeRefund.threshold}h` : `NO — needs ${a.feeRefund.threshold}h`) : 'N/A'} hot={!!a.feeRefund?.eligible} />
          <Stat label="EU261/UK261" value={a.euComp ? (a.euComp.payable ? `€${a.euComp.euros}` : `€${a.euComp.euros} · <3h`) : 'N/A'} hot={!!a.euComp?.payable} />
          <Stat label="APPR (LARGE)" value={a.apprComp?.cad ? `C$${a.apprComp.cad}` : 'N/A'} hot={!!a.apprComp?.cad} />
          <Stat label="MONTREAL CAP" value={`≈ US$${a.montreal.capUsd}`} />
        </div>
        <p className="mono text-[9px] text-[#e6c87a] mt-2 flex items-center gap-1.5"><TriangleAlert size={10} />{a.montreal.warning}</p>
        <ul className="mt-3 space-y-1.5">{a.checklist.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-[#c9cddb]"><ListChecks size={11} className="text-[var(--cyan)] mt-0.5 shrink-0" aria-hidden />{c}</li>
        ))}</ul>
      </PopVerdict>

      <div className="grid grid-cols-2 gap-2.5">
        <input className="field" placeholder="Airline" value={f.airline} onChange={set('airline')} aria-label="Airline" />
        <input className="field" placeholder="PNR" value={f.pnr} onChange={set('pnr')} aria-label="PNR" />
        <input className="field" placeholder="Flight no." value={f.flightNo} onChange={set('flightNo')} aria-label="Flight number" />
        <input className="field" placeholder="Bag tag" value={f.bagTag} onChange={set('bagTag')} aria-label="Bag tag" />
        <input className="field col-span-2" placeholder="Passenger name" value={f.passengerName} onChange={set('passengerName')} aria-label="Passenger name" />
        <input className="field col-span-2" placeholder="Postal address" value={f.address} onChange={set('address')} aria-label="Address" />
      </div>
      <button onClick={letter} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold py-3 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)]"><FileText size={14} />Generate statutory demand letter (.txt)</button>
      <p className="mono text-[8px] text-[var(--dim)]">Statutes simplified for triage — DOT 14 CFR 254 · Reg (EC) 261/2004 · UK261 · CTA APPR · Montreal 1999 (1,519 SDR). SDR rate is approximate; verify at IMF. This template is not legal advice; escalate to DOT/CAA/CTA or small-claims.</p>
    </section>
  );
}

export default function RecoverView({ pack }: { pack: CountryPack }) {
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-6">
      <div className="p-3 sm:p-5 space-y-4">
        <div className="grid xl:grid-cols-2 gap-4 items-start">
          <Unclaimed pack={pack} />
          <Luggage />
        </div>
        <div className="grid xl:grid-cols-2 gap-4 items-start">
          <DepositPacket />
          <WagePacket />
        </div>
        <SettlementWatchlist />
        <ComplaintDesk />
      </div>
    </div>
  );
}
