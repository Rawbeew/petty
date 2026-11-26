/* Petty — optional accounts. DORMANT unless this build carries VITE_SUPABASE_URL/ANON_KEY.
 * When dormant, the sign-in button does not render anywhere — no theater, no dead ends. */
import { useEffect, useState } from 'react';
import { X, UserRound, Mail, ShieldCheck, RefreshCw, LogOut, Crown } from 'lucide-react';
import { isSupabaseConfigured, sendMagicLink, signOut, getCurrentUser, onAuthChange, type AuthUser } from '../lib/supabase';
import { syncNow, claimSeat, getLastSyncAt, type SyncResult } from '../lib/sync';

export default function AccountModal({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); /* async bootstrap only */
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pass, setPass] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(() => getLastSyncAt());

  useEffect(() => {
    void getCurrentUser()
      .then(u => { setUser(u); setLoading(false); if (u !== null) void claimSeat(); })
      .catch(() => { setLoading(false); });
    const unsub = onAuthChange(() => { void getCurrentUser().then(u => { setUser(u); }); });
    return unsub;
  }, []);

  const submit = async () => {
    setError(null);
    if (!email.includes('@') || email.length < 6) { setError('That does not look like an email address.'); return; }
    const r = await sendMagicLink(email);
    if (r.ok) setSent(true); else setError(r.error ?? 'Could not send the link.');
  };

  const doSync = async () => {
    setSyncing(true); setError(null); setResult(null);
    try {
      const r = await syncNow(pass);
      setResult(r); setLastSync(getLastSyncAt());
    } catch (e) { setError(e instanceof Error ? e.message : 'Sync failed before anything was written — your device is untouched.'); }
    finally { setSyncing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Petty account">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--line2)] bg-[var(--panel)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg flex items-center gap-2"><UserRound size={17} className="text-[var(--gold)]" aria-hidden />Account <span className="mono text-[8px] text-[var(--dim)] tracking-[0.25em] ml-1">OPTIONAL</span></h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-[var(--panel2)] text-[var(--dim)] hover:text-[var(--ink)]"><X size={17} /></button>
        </div>

        {!isSupabaseConfigured() && (
          <p className="text-[12px] text-[var(--dim)] leading-relaxed">Accounts are not enabled in this build — everything works exactly as it always has. If you want sign-in later, it takes one Supabase project and one Resend account (see README § Accounts). No account is ever required for law.</p>
        )}

        {isSupabaseConfigured() && loading && <p className="mono text-[10px] text-[var(--dim)]">CHECKING SESSION…</p>}

        {isSupabaseConfigured() && !loading && !user && (
          <>
            {!sent ? (
              <>
                <p className="text-[12px] text-[#c9cddb] leading-relaxed">Passwordless. Enter your email — we send a one-time sign-in link (valid 1 hour). Your pantry, photos and case file still never leave this device; the account exists for your <strong className="text-[var(--ink)]">billing state and encrypted sync</strong> only.</p>
                <div className="flex gap-2">
                  <input autoFocus type="email" inputMode="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); }} onKeyDown={e => { if (e.key === 'Enter') void submit(); }} placeholder="you@example.com" className="field flex-1" aria-label="Email for magic link" />
                  <button onClick={() => { void submit(); }} className="rounded-xl bg-[var(--gold)] text-black font-bold px-4 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)]"><Mail size={13} className="inline mr-1" />Send link</button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-[rgba(61,220,151,0.35)] bg-[rgba(61,220,151,0.08)] p-4 text-[12px] text-[#a9e8c9] leading-relaxed"><ShieldCheck size={14} className="inline mr-1.5" aria-hidden />Link sent to <strong>{email}</strong>. It expires in 1 hour and works once. Not in inbox? Check spam — and the sender is aslepp@petty (Resend), not Petty itself.</div>
            )}
            {error && <p role="alert" className="mono text-[9px] text-[#ff8a8a]">{error}</p>}
          </>
        )}

        {isSupabaseConfigured() && !loading && user && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[var(--line2)] px-4 py-3">
              <span className="min-w-0"><span className="mono text-[8px] text-[var(--dim)] block">SIGNED IN AS</span><span className="text-[12px] text-[var(--ink)] break-all">{user.email}</span></span>
              <button onClick={() => { void signOut(); setUser(null); }} className="inline-flex items-center gap-1.5 mono text-[8px] text-[var(--dim)] hover:text-[var(--ink)] border border-[var(--line2)] rounded-lg px-3 py-2 uppercase tracking-[0.15em]"><LogOut size={12} />Sign out</button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="mono text-[9px] tracking-[0.25em] text-[var(--gold)] flex items-center gap-1.5"><Crown size={11} />VAULT SYNC — E2EE</span>{lastSync && <span className="mono text-[8px] text-[var(--dim)]">LAST {new Date(lastSync).toLocaleString()}</span>}</div>
              <input type="password" autoComplete="off" value={pass} onChange={e => { setPass(e.target.value); }} placeholder="Vault passphrase (8+ chars — never stored server-side)" className="field w-full" aria-label="Vault passphrase" />
              <button onClick={() => { void doSync(); }} disabled={syncing || pass.length < 8} className="w-full rounded-xl border border-[var(--gold)] text-[var(--gold)] py-2.5 mono text-[10px] tracking-[0.2em] uppercase hover:bg-[rgba(242,193,78,0.1)] disabled:opacity-40 flex items-center justify-center gap-2"><RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Syncing…' : 'Sync now'}</button>
              {result && <p className="mono text-[9px] text-[var(--green)]">Pushed {result.pushed} · pulled {result.pulled}{result.skipped > 0 ? ` · skipped ${result.skipped} (wrong passphrase?)` : ''} · plan: {result.plan}</p>}
              {error && <p role="alert" className="mono text-[9px] text-[#ff8a8a]">{error}</p>}
              <p className="mono text-[7.5px] text-[var(--dim)] leading-relaxed">Server stores AES-256-GCM envelopes + the routing date only. Forgetting the passphrase = ciphertext is unrecoverable. Local deletes do not propagate (v2). Photos are never synced.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
