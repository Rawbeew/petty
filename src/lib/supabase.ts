/* Petty — optional account backend. EVERYTHING here is dormant until the env vars
 * exist (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). No accounts are created, no
 * network calls fire, no sign-in UI renders. Law is never behind this door. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const envStr = (key: string): string => {
  const v: unknown = import.meta.env[key];
  return typeof v === 'string' ? v : '';
};
const url = envStr('VITE_SUPABASE_URL');
const anon = envStr('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = (): boolean =>
  url.startsWith('https://') && url.includes('.supabase.co') && anon.length > 20;

let cached: SupabaseClient | null = null;
export const supabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  cached ??= createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'petty.auth' },
  });
  return cached;
};

export interface AuthUser { id: string; email: string; }

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const sb = supabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user?.email ? { id: user.id, email: user.email } : null;
};

/** Magic link. `redirectTo` defaults to the current origin root (must be allow-listed in Supabase URL Config). */
export const sendMagicLink = async (email: string): Promise<{ ok: boolean; error?: string }> => {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'Accounts are not configured in this build.' };
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin + '/', shouldCreateUser: true },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
};

export const signOut = async (): Promise<void> => { await supabase()?.auth.signOut(); };

/** Plan read from the server — RLS lets the owner read their own row only. */
export const fetchServerPlan = async (): Promise<'free' | 'household' | null> => {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.from('profiles').select('plan').maybeSingle();
  if (error || typeof data !== 'object' || data === null) return null;
  const plan: unknown = Reflect.get(data, 'plan');
  return plan === 'household' ? 'household' : 'free';
};

export const onAuthChange = (cb: () => void): (() => void) => {
  const sb = supabase();
  if (!sb) return () => undefined;
  const { data: { subscription } } = sb.auth.onAuthStateChange(cb);
  return () => { subscription.unsubscribe(); };
};
