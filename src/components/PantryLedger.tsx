/* The Pantry — your household shelf, watched. Local-only (IndexedDB), no account, no sync.
 * Purpose: keep the items you actually have one re-scan away from every new enforcement dataset. */
import { useCallback, useEffect, useState } from 'react';
import { Package, Trash2, ShieldCheck, ScanLine, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import {
  isStorageAvailable, listItems, putItem, deleteItem, newItem, itemScope, requestPersistence,
  type HouseholdItem, type HouseholdCategory, type PersistStatus,
} from '../lib/household';
import { SectionHeader } from './ui/SectionHeader';
import PhotoEvidence from './PhotoEvidence';
import { useCaseFile } from '../lib/caseFile';
import { cx, downloadText } from '../lib/ui';

const CATEGORIES: { id: HouseholdCategory; label: string }[] = [
  { id: 'food', label: 'Food & drink' }, { id: 'drug', label: 'Drug / OTC' }, { id: 'device', label: 'Medical device' },
  { id: 'cosmetic', label: 'Cosmetic' }, { id: 'other', label: 'Other' },
];

export default function PantryLedger({ onRecallCheck }: { onRecallCheck: (query: string) => void }) {
  const { beginFromItem } = useCaseFile();
  const [items, setItems] = useState<HouseholdItem[] | null>(null);
  const [unavailable, setUnavailable] = useState(!isStorageAvailable());
  const [persist, setPersist] = useState<PersistStatus | null>(null);
  const [name, setName] = useState(''); const [brand, setBrand] = useState(''); const [category, setCategory] = useState<HouseholdCategory>('food'); const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const isCategory = (v: string): v is HouseholdCategory => CATEGORIES.some(c => c.id === v);
  const storageOk = !unavailable;

  const reload = useCallback(async () => {
    try { setItems(await listItems()); } catch { setUnavailable(true); setItems([]); }
  }, []);

  useEffect(() => {
    const alive = { current: true };
    void (async () => {
      try { const rows = await listItems(); if (alive.current) { setItems(rows); } }
      catch { if (alive.current) { setUnavailable(true); setItems([]); } }
      const status = await requestPersistence(); if (alive.current) { setPersist(status); }
    })();
    return () => { alive.current = false; };
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    try {
      await putItem(newItem(name, brand, category, note));
      setName(''); setBrand(''); setNote('');
      await reload();
    } catch { setUnavailable(true); }
  };
  const remove = async (id: string) => { if (!window.confirm('Remove this item and its photos from this device?')) return; await deleteItem(id).catch(() => { setUnavailable(true); }); await reload(); };

  const exportManifest = () => {
    const rows = items ?? [];
    downloadText('petty-household-ledger.txt', [
      'PETTY — HOUSEHOLD LEDGER (on-device export)',
      `Generated: ${new Date().toISOString()} · ${rows.length} item(s)`,
      '',
      ...rows.map((r, i) => `${String(i + 1).padStart(2, ' ')}. ${r.name}${r.brand ? ` — ${r.brand}` : ''} [${r.category}]${r.note ? `\n     note: ${r.note}` : ''}\n     added: ${r.addedAt.slice(0, 10)}`),
      '',
      'HOW TO USE THIS FILE',
      ' - Re-verify any item in Petty → Receipts → Recall Scanner. Scans are dated; this manifest is NOT a recall clearance.',
      ' - Photos attached here are NOT included — download them individually before clearing browser data.',
      ' - Information, not safety or medical advice. Act on the linked agency notice, never on this file alone.',
    ].join('\n'));
  };

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={Package} kicker="The Pantry — household ledger" title="Your shelf, watched. Nothing leaves this device."
        right={persist ? <span className={cx('chip', persist === 'persisted' ? 'chip-gold' : '')}>{persist === 'persisted' ? 'STORAGE PERSISTED' : persist === 'prompt' ? 'MAY BE EVICTED — EXPORT OFTEN' : 'STORAGE UNKNOWN'}</span> : undefined} />
      {!storageOk && (
        <div className="rounded-xl border border-[rgba(255,90,90,0.35)] p-3 text-[10px] text-[#e6a2a2]">Browser storage refused (private mode?) — the pantry cannot be kept on this device. Use a normal window.</div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <input className="field col-span-2" placeholder="Product name*" value={name} onChange={e => { setName(e.target.value); }} aria-label="Product name" />
        <input className="field" placeholder="Brand" value={brand} onChange={e => { setBrand(e.target.value); }} aria-label="Brand" />
        <select className="field" value={category} onChange={e => { setCategory(isCategory(e.target.value) ? e.target.value : 'other'); }} aria-label="Category">{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <input className="field col-span-2" placeholder="Note (lot, store, why — optional)" value={note} onChange={e => { setNote(e.target.value); }} aria-label="Note" />
        <button onClick={() => { void add(); }} disabled={!name.trim()} className="col-span-2 md:col-span-2 rounded-xl bg-[var(--gold)] text-black font-bold py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)] disabled:opacity-40">Add to pantry</button>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
        <span className="mono text-[9px] text-[var(--dim)]">{items === null ? 'LOADING…' : `${items.length} ITEM${items.length === 1 ? '' : 'S'} ON FILE`}</span>
        <button onClick={exportManifest} disabled={!items || items.length === 0} className="inline-flex items-center gap-1.5 mono text-[9px] text-[var(--dim)] hover:text-[var(--ink)] disabled:opacity-40"><Download size={11} />Export ledger (.txt)</button>
      </div>
      <ul className="space-y-2">
        {items?.map(it => (
          <li key={it.id} className="rounded-xl border border-[var(--line2)] p-3">
            <div className="flex items-start gap-2">
              <button onClick={() => { setExpanded(expanded === it.id ? null : it.id); }} className="flex-1 min-w-0 text-left" aria-expanded={expanded === it.id}>
                <div className="flex items-center gap-2 flex-wrap"><span className="text-[12px] text-[var(--ink)]">{it.name}</span>{it.brand && <span className="mono text-[8px] text-[var(--dim)]">· {it.brand}</span>}<span className="chip">{it.category}</span></div>
                {it.note && <p className="text-[10px] text-[var(--dim)] mt-1">{it.note}</p>}
                <p className="mono text-[8px] text-[var(--dim)] mt-1">added {it.addedAt.slice(0, 10)}</p>
              </button>
              <span className="flex items-center gap-1 shrink-0">
                <button onClick={() => { onRecallCheck([it.brand, it.name].filter(Boolean).join(' ')); }} title="Scan this item in the Recall Scanner" aria-label="Scan in recall scanner" className="p-2 rounded-lg border border-[var(--line2)] hover:border-[var(--gold)] text-[var(--dim)] hover:text-[var(--gold)]"><ScanLine size={14} /></button>
                <button onClick={() => { beginFromItem(it); }} title="Start an official complaint using this item" aria-label="Start complaint with this item" className="p-2 rounded-lg border border-[var(--line2)] hover:border-[var(--cyan)] text-[var(--dim)] hover:text-[var(--cyan)]"><FileText size={14} /></button>
                <button onClick={() => { void remove(it.id); }} aria-label="Remove item" className="p-2 rounded-lg border border-[var(--line2)] hover:border-[#ff5a5a] text-[var(--dim)] hover:text-[#ff5a5a]"><Trash2 size={14} /></button>
                <button onClick={() => { setExpanded(expanded === it.id ? null : it.id); }} aria-label={expanded === it.id ? 'Hide photos' : 'Show photos'} className="p-2 rounded-lg border border-[var(--line2)] text-[var(--dim)] hover:text-[var(--ink)]">{expanded === it.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
              </span>
            </div>
            {expanded === it.id && <div className="mt-3 border-t border-[var(--line)] pt-3"><PhotoEvidence scope={itemScope(it.id)} /></div>}
          </li>
        ))}
        {items?.length === 0 && storageOk && <li className="mono text-[9px] text-[var(--dim)] text-center py-4">Nothing on file. Add the pantry jars, the losartan, the infusion pump — the things you actually live with.</li>}
      </ul>
      <p className="mono text-[8px] text-[var(--dim)]"><ShieldCheck size={9} className="inline text-[var(--green)]" /> Local-only: IndexedDB on this origin, this browser. No account. No sync. Petty’s developers cannot see your shelf. Clearing site data erases it — export what matters. Scan times are dated; this ledger is not a recall clearance.</p>
    </section>
  );
}
