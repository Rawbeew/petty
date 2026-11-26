/* Docket sweep — "has this product / maker been in court lately?" A user-gesture-gated,
 * deterministic CourtListener query (type=d). Free token required; without one, the deep link
 * is offered. Zero network until the button is tapped; zero invention if the API is quiet. */
import { useState } from 'react';
import { Gavel, ExternalLink } from 'lucide-react';
import { clToken, docketDeepLink, fetchDockets, type DocketHit } from '../lib/courtlistener';

export default function LitigationSweep({ query }: { query: string }) {
  const q = query.trim();
  const [state, setState] = useState<'idle' | 'loading' | 'live' | 'error' | 'blocked'>('idle');
  const [hits, setHits] = useState<DocketHit[]>([]);
  if (!q) return null;

  const run = async () => {
    const token = clToken();
    if (!token) { setState('error'); setHits([]); return; }
    setState('loading');
    try {
      const rows = await fetchDockets(q, token, 5);
      setHits(rows); setState('live');
    } catch (e) {
      setState(e instanceof Error && e.message === 'auth' ? 'error' : 'blocked');
      setHits([]);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--line2)] p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="mono text-[8px] tracking-[0.25em] text-[var(--dim)] flex items-center gap-1.5"><Gavel size={10} className="text-[var(--gold)]" />LITIGATION CHECK — COURT DOCKETS</span>
        <button onClick={() => { void run(); }} disabled={state === 'loading'} className="mono text-[8px] tracking-[0.2em] uppercase rounded-lg border border-[var(--line2)] px-3 py-1.5 text-[var(--cyan)] hover:border-[var(--cyan)] disabled:opacity-50">{state === 'loading' ? 'QUERYING…' : 'Run docket sweep'}</button>
      </div>
      <a href={docketDeepLink(q)} target="_blank" rel="noreferrer" className="mono text-[8px] text-[var(--dim)] hover:text-[var(--cyan)] inline-flex items-center gap-1 break-all">or open CourtListener dockets for “{q.slice(0, 60)}” — no token needed <ExternalLink size={8} /></a>
      {state === 'error' && <p className="mono text-[8px] text-[#e6c87a]">No CourtListener token on this device (or it was rejected). Add one in Receipts → Docket Search — free, 125 req/day. The deep link above works without it.</p>}
      {state === 'blocked' && <p className="mono text-[8px] text-[var(--dim)]">Browser blocked the call. Use the deep link above — same query, no credential needed.</p>}
      {state === 'live' && hits.length === 0 && <p className="mono text-[8px] text-[var(--green)]">Zero dockets match “{q}” — quiet, not missing.</p>}
      {state === 'live' && hits.length > 0 && (
        <ul className="space-y-1.5 max-h-56 overflow-y-auto">
          {hits.map((h, i) => (
            <li key={`${h.pageUrl}-${i}`} className="rounded-lg border border-[var(--line)] p-2">
              <p className="text-[10px] text-[var(--ink)] leading-snug">{h.caseName}</p>
              <p className="mono text-[8px] text-[var(--dim)] mt-0.5">{h.court}{h.dateFiled && ` · filed ${h.dateFiled}`}{h.docketNumber && ` · ${h.docketNumber}`}</p>
              <a href={h.pageUrl} target="_blank" rel="noreferrer" className="mono text-[8px] text-[var(--cyan)] hover:underline">docket ↗</a>
            </li>
          ))}
        </ul>
      )}
      <p className="mono text-[7px] text-[var(--dim)]">A filing is an allegation, not a verdict. Dockets change; pull the record before repeating it. Not legal advice; Petty is not affiliated with any court.</p>
    </div>
  );
}
