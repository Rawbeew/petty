/* Health Canada Recalls & Safety Alerts — WEEKLY CI SNAPSHOT, never pretends to be live.
   Static JSON built by scripts/ingest_ca_recalls.py → public/ca-recalls.json.
   Titles verbatim (unicode-normalized only). Open Government Licence – Canada. */
import { useEffect, useState } from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

interface CaRecall { nid: string; title: string; organization: string; issue: string; recallClass: string; updated: string; url: string; }
interface CaSnapshot { generatedAt: string; source: string; sourceUrl: string; license: string; attribution: string; count: number; recalls: CaRecall[]; }

const ORG_TONE: Record<string, string> = {
  'Consumer product safety': '#f2c14e', 'CFIA': '#3ddc97', 'Medical devices': '#59d5f0', 'Drugs and health products': '#ff5a5a',
};

export default function CaRecalls() {
  const [snap, setSnap] = useState<CaSnapshot | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'unreachable'>('loading');
  const [show, setShow] = useState(8);

  useEffect(() => {
    let alive = true;
    fetch('/ca-recalls.json')
      .then(async r => {
        if (!r.ok) throw new Error(String(r.status));
        // Trust boundary: file is produced only by our own CI ingest (scripts/ingest_ca_recalls.py).
        // A malformed file throws here and renders the unreachable state — never a phantom list.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const d: CaSnapshot = await r.json();
        return d;
      })
      .then(d => { if (alive) { setSnap(d); setState('ok'); } })
      .catch(() => { if (alive) setState('unreachable'); });
    return () => { alive = false; };
  }, []);

  return (
    <section className="panel p-4 sm:p-5" aria-label="Health Canada recalls — weekly snapshot">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={15} className="text-[var(--gold)]" />
          <div>
            <div className="mono text-[9px] tracking-[0.3em] text-[var(--dim)]">HEALTH CANADA · CFIA · TC — WEEKLY SNAPSHOT</div>
            <h3 className="font-display text-base mt-0.5">Recalls &amp; safety alerts, verbatim</h3>
          </div>
        </div>
        {snap && <span className="mono text-[8.5px] text-[var(--dim)] text-right leading-tight">SNAPSHOT {new Date(snap.generatedAt).toUTCString().slice(5, 16).toUpperCase()}<br />NOT LIVE — VERIFY AT SOURCE</span>}
      </div>

      {state === 'unreachable' && (
        <div className="mt-3 rounded-xl border border-[var(--line2)] p-4 text-[12px] text-[var(--dim)]">
          Snapshot missing or unreadable in this build. The live, authoritative list is always at{' '}
          <a href="https://recalls-rappels.canada.ca/" target="_blank" rel="noreferrer" className="text-[var(--cyan)] hover:underline inline-flex items-center gap-1">recalls-rappels.canada.ca <ExternalLink size={11} /></a>.
        </div>
      )}
      {state === 'loading' && <div className="mt-3 mono text-[10px] text-[var(--dim)]">LOADING WEEKLY SNAPSHOT…</div>}

      {snap && (
        <>
          <ul className="mt-3 divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
            {snap.recalls.slice(0, show).map(r => (
              <li key={r.nid || r.url} className="py-2.5 flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: ORG_TONE[r.organization] ?? '#8a8fa3' }} aria-hidden />
                <span className="min-w-0">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-[12.5px] leading-snug text-[var(--ink)] hover:text-[var(--gold)] transition-colors">{r.title}</a>
                  <span className="block mono text-[8.5px] text-[var(--dim)] mt-1">{r.organization.toUpperCase()}{r.recallClass ? ` · ${r.recallClass.toUpperCase()}` : ''} · UPDATED {r.updated}</span>
                </span>
              </li>
            ))}
          </ul>
          {show < snap.recalls.length && (
            <button onClick={() => { setShow(n => n + 12); }} className="mt-3 mono text-[9px] tracking-[0.2em] uppercase text-[var(--dim)] hover:text-[var(--ink)] transition-colors">Show more ({snap.recalls.length - show} more in snapshot)</button>
          )}
          <p className="mt-3 mono text-[8px] text-[var(--dim)] leading-relaxed">{snap.attribution} · {snap.license} · {snap.count} most recent non-archived alerts, titles verbatim. Petty does not verify medical advice — read the notice or ask your pharmacist. Not affiliated with Health Canada.</p>
        </>
      )}
    </section>
  );
}
