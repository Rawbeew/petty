// Petty — Stripe webhook → profiles.plan. RUNTIME: Supabase Edge Function (Deno).
// Verifies the Stripe-Signature header with the webhook secret before trusting anything.
// Secrets (set via `supabase secrets set`): STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
// Wire in Stripe Dashboard → Developers → Webhooks → https://<project>.functions.supabase.co/stripe-webhook
// Events: customer.subscription.created|updated|deleted (checkout completion arrives as .created)
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ok = (msg = 'ok') => new Response(msg, { status: 200 });

async function hmacSha256Hex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

serve(async req => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  if (!WEBHOOK_SECRET || !SERVICE) return new Response('misconfigured', { status: 500 });

  const body = await req.text();
  const sigHeader = req.headers.get('stripe-signature') ?? '';
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=').map(x => x.trim())) as [string, string][]);
  const t = parts['t']; const v1 = parts['v1'];
  if (!t || !v1) return new Response('bad signature header', { status: 400 });
  const expected = await hmacSha256Hex(WEBHOOK_SECRET, `${t}.${body}`);
  if (!timingSafeEqual(expected, v1)) return new Response('signature mismatch', { status: 400 });

  const event = JSON.parse(body) as {
    type: string;
    data: { object: { id: string; customer: string; status: string; current_period_end?: number; metadata?: Record<string, string> } };
  };
  const sub = event.data.object;
  if (!['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    return ok('ignored');
  }

  const sb = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
  const active = sub.status === 'active' || sub.status === 'trialing';
  const profileRes = await sb.from('profiles').select('id').eq('stripe_customer_id', sub.customer).maybeSingle();
  let userId: string | null = (profileRes.data as { id: string } | null)?.id ?? null;

  // First-ever event for this customer: attach via customer email if the profile exists under it.
  if (!userId && typeof sub.metadata?.['email'] === 'string') {
    const byEmail = await sb.from('profiles').select('id').eq('email', sub.metadata['email'].toLowerCase()).maybeSingle();
    userId = (byEmail.data as { id: string } | null)?.id ?? null;
  }
  if (userId) {
    await sb.from('profiles').update({ plan: active ? 'household' : 'free', stripe_customer_id: sub.customer }).eq('id', userId);
    await sb.from('subscriptions').upsert({
      user_id: userId, stripe_customer_id: sub.customer, stripe_subscription_id: sub.id,
      status: sub.status, current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });
  } else {
    // Unknown customer: record the subscription anyway — never drop billing facts on the floor.
    await sb.from('subscriptions').upsert({
      stripe_customer_id: sub.customer, stripe_subscription_id: sub.id,
      status: sub.status, current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });
  }
  return ok();
});
