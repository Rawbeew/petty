// Petty — daily digest cron (07:00 UTC). Sends a CONTENT-FREE nudge: the server cannot
// decrypt E2EE bodies, so the email says "a deadline exists <date>" and nothing else.
// Secrets: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Schedule in Supabase Dashboard → Edge Functions → Schedules: 0 7 * * *
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM = Deno.env.get('DIGEST_FROM') ?? 'Petty <onboarding@resend.dev>';

serve(async req => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  if (!RESEND || !SERVICE) return new Response('misconfigured', { status: 500 });
  const sb = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

  const today = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const in3 = new Date(today.getTime() + 3 * 86_400_000);

  const { data: rows, error } = await sb.from('clockwatch_entries')
    .select('user_id, due_date')
    .gte('due_date', toISO(today))
    .lte('due_date', toISO(in3));
  if (error) return new Response(error.message, { status: 500 });

  const byUser = new Map<string, Set<string>>();
  for (const r of (rows ?? []) as { user_id: string; due_date: string }[]) {
    const set = byUser.get(r.user_id) ?? new Set<string>();
    set.add(r.due_date);
    byUser.set(r.user_id, set);
  }

  let sent = 0; const failures: string[] = [];
  for (const [userId, dates] of byUser) {
    const { data: profile } = await sb.from('profiles').select('email').eq('id', userId).maybeSingle();
    const email = (profile as { email: string } | null)?.email;
    if (!email) continue;
    const list = [...dates].sort().join(', ');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [email],
        subject: 'Petty — you have a deadline inside 3 days',
        text: `You asked Petty to watch your clock.\n\nA deadline on ${list} is inside the next 3 days. Open Petty on your device to see what it is — Petty cannot read your deadlines from our servers, by design.\n\nhttps://your-domain.example/ — or the app on your phone if you installed it.\n\nPetty is information, not legal advice.`,
      }),
    });
    if (res.ok) sent++; else failures.push(`${userId}: ${res.status}`);
  }
  return new Response(JSON.stringify({ sent, failures }), { headers: { 'Content-Type': 'application/json' } });
});
