/* Petty — sync transport for optional accounts.
 * Trust model: server stores opaque AES-256-GCM envelopes + plaintext ROUTING DATES only
 * (due_date / expires_at) — disclosed in Terms. Titles, names and notes are never readable
 * server-side. Wrong passphrase → rows are skipped and counted, never guessed.
 * Per-row last-write-wins on updated_at. Local deletes are NOT propagated (tombstones = v2).
 * Any failure throws BEFORE local data is modified — a half-finished sync never clobbers the device. */
import { supabase, getCurrentUser, fetchServerPlan } from './supabase';
import { deriveVaultKey, encryptJson, decryptJson, newSaltHex, isEnvelope } from './e2ee';
import { safeGet, safeSet } from './safeStorage';
import { loadReminders, upsertReminder, type Reminder } from './reminders';
import { listItems, putItem, type HouseholdCategory } from './household';

const DEVICE_KEY = 'petty.deviceId';
const LAST_SYNC_KEY = 'petty.lastSyncAt';

export const getLastSyncAt = (): string | null => safeGet(LAST_SYNC_KEY);

const deviceId = (): string => {
  let d = safeGet(DEVICE_KEY);
  if (!d) { d = crypto.randomUUID(); safeSet(DEVICE_KEY, d); }
  return d;
};

interface ProfileRow {
  id: string; email: string; plan: string; sync_salt: string;
}
const member = (v: unknown, key: string): unknown => (typeof v === 'object' && v !== null ? Reflect.get(v, key) as unknown : undefined);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const toProfileRow = (v: unknown): ProfileRow | null => {
  const id = member(v, 'id'); const email = member(v, 'email'); const plan = member(v, 'plan'); const syncSalt = member(v, 'sync_salt');
  if (typeof id !== 'string' || typeof email !== 'string' || typeof plan !== 'string' || typeof syncSalt !== 'string') return null;
  return { id, email, plan, sync_salt: syncSalt };
};

export const ensureProfile = async (userId: string, email: string): Promise<ProfileRow> => {
  const sb = supabase();
  if (!sb) throw new Error('Accounts are not configured in this build.');
  const { data: existingRaw, error: selErr } = await sb.from('profiles').select('id,email,plan,sync_salt').eq('id', userId).maybeSingle();
  if (selErr) throw new Error(selErr.message);
  const existing = toProfileRow(existingRaw);
  if (existing) return existing;
  const { data: createdRaw, error: insErr } = await sb.from('profiles')
    .insert({ id: userId, email: email.toLowerCase(), sync_salt: newSaltHex() })
    .select('id,email,plan,sync_salt').single();
  if (insErr) throw new Error(insErr.message);
  const created = toProfileRow(createdRaw);
  if (!created) throw new Error('profile row came back malformed');
  return created;
};

interface Clockwire { id: string; user_id: string; device_id: string; due_date: string; updated_at: string; body: string; }
interface Pantrywire { id: string; user_id: string; device_id: string; expires_at: string | null; updated_at: string; body: string; }
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const toWire = (v: unknown): Clockwire | null => {
  const id = member(v, 'id'); const userId = member(v, 'user_id'); const deviceId = member(v, 'device_id');
  const dueDate = member(v, 'due_date'); const updatedAt = member(v, 'updated_at'); const body = member(v, 'body');
  if (typeof id !== 'string' || typeof userId !== 'string' || typeof deviceId !== 'string') return null;
  if (typeof dueDate !== 'string' || !ISO_DATE.test(dueDate)) return null;
  if (typeof updatedAt !== 'string' || typeof body !== 'string') return null;
  return { id, user_id: userId, device_id: deviceId, due_date: dueDate, updated_at: updatedAt, body };
};
const toPantryWire = (v: unknown): Pantrywire | null => {
  const id = member(v, 'id'); const userId = member(v, 'user_id'); const deviceId = member(v, 'device_id');
  const expiresAt = member(v, 'expires_at'); const updatedAt = member(v, 'updated_at'); const body = member(v, 'body');
  if (typeof id !== 'string' || typeof userId !== 'string' || typeof deviceId !== 'string') return null;
  if (expiresAt !== null && expiresAt !== undefined && (typeof expiresAt !== 'string' || !ISO_DATE.test(expiresAt))) return null;
  if (typeof updatedAt !== 'string' || typeof body !== 'string') return null;
  return { id, user_id: userId, device_id: deviceId, expires_at: typeof expiresAt === 'string' ? expiresAt : null, updated_at: updatedAt, body };
};

export interface SyncResult {
  pushed: number;       /* rows written to the cloud this run */
  pulled: number;       /* remote rows written onto this device */
  skipped: number;      /* rows we could not decrypt (wrong passphrase / other-device-only) */
  plan: 'free' | 'household';
}

const isCategory = (v: unknown): v is HouseholdCategory =>
  v === 'food' || v === 'drug' || v === 'device' || v === 'cosmetic' || v === 'other';

export const syncNow = async (passphrase: string): Promise<SyncResult> => {
  if (!passphrase || passphrase.length < 8) throw new Error('Vault passphrase must be at least 8 characters.');
  const sb = supabase();
  if (!sb) throw new Error('Accounts are not configured in this build.');
  const user = await getCurrentUser();
  if (!user) throw new Error('Sign in first.');
  const profile = await ensureProfile(user.id, user.email);
  const key = await deriveVaultKey(passphrase, profile.sync_salt);
  const device = deviceId();
  const pushStamp = new Date().toISOString();
  let pushed = 0; let pulled = 0; let skipped = 0;

  /* ── clockwatch ─────────────────────────────────────────────── */
  const localRem = loadReminders();
  const { data: remoteRemRows, error: remSelErr } = await sb.from('clockwatch_entries').select('id,user_id,device_id,due_date,updated_at,body');
  if (remSelErr) throw new Error(remSelErr.message);
  const remoteRem = (Array.isArray(remoteRemRows) ? remoteRemRows : []).map(toWire).filter((w): w is Clockwire => w !== null);
  const remoteRemById = new Map(remoteRem.map(r => [r.id, r]));
  const localRemById = new Map(localRem.map(r => [r.id, r]));

  const remPush: Clockwire[] = [];
  for (const r of localRem) {
    const remote = remoteRemById.get(r.id);
    if (remote && Date.parse(remote.updated_at) >= Date.parse(r.createdAt)) {
      continue; /* remote not older — never clobber a newer device silently */
    }
    remPush.push({
      id: r.id, user_id: user.id, device_id: device, due_date: r.dueAt, updated_at: pushStamp,
      body: await encryptJson(key, { title: r.title, source: r.source, done: r.done, createdAt: r.createdAt }),
    });
  }
  if (remPush.length > 0) {
    const { error } = await sb.from('clockwatch_entries').upsert(remPush, { onConflict: 'id' });
    if (error) throw new Error(`clockwatch push: ${error.message}`);
    pushed += remPush.length;
  }
  for (const w of remoteRem) {
    const local = localRemById.get(w.id);
    const remoteNewer = !local || Date.parse(w.updated_at) > Date.parse(local.createdAt);
    if (remPush.some(p => p.id === w.id)) continue;   /* we just pushed local's newer version */
    if (!remoteNewer) continue;
    if (!isEnvelope(w.body)) { skipped++; continue; }
    try {
      const d = await decryptJson(key, w.body);
      const title = str(member(d, 'title'));
      const srcRaw = str(member(d, 'source'));
      const createdAt = str(member(d, 'createdAt'));
      const done = member(d, 'done') === true;
      const source: Reminder['source'] = srcRaw === 'deposit' || srcRaw === 'complaint' ? srcRaw : 'manual';
      if (!title || !createdAt) { skipped++; continue; }
      if (upsertReminder({ id: w.id, title, source, done, dueAt: w.due_date, createdAt })) pulled++; else skipped++;
    } catch { skipped++; }
  }

  /* ── pantry ─────────────────────────────────────────────────── */
  const localItems = await listItems();
  const { data: remotePanRows, error: panSelErr } = await sb.from('pantry_items').select('id,user_id,device_id,expires_at,updated_at,body');
  if (panSelErr) throw new Error(panSelErr.message);
  const remotePan = (Array.isArray(remotePanRows) ? remotePanRows : []).map(toPantryWire).filter((w): w is Pantrywire => w !== null);
  const remotePanById = new Map(remotePan.map(r => [r.id, r]));
  const localPanById = new Map(localItems.map(i => [i.id, i]));

  const panPush: Pantrywire[] = [];
  for (const i of localItems) {
    const remote = remotePanById.get(i.id);
    if (remote && Date.parse(remote.updated_at) >= Date.parse(i.addedAt)) continue;
    panPush.push({
      id: i.id, user_id: user.id, device_id: device,
      expires_at: i.expiresAt ?? null, updated_at: pushStamp,
      body: await encryptJson(key, { name: i.name, brand: i.brand, category: i.category, note: i.note, addedAt: i.addedAt, expiresAt: i.expiresAt ?? null }),
    });
  }
  if (panPush.length > 0) {
    const { error } = await sb.from('pantry_items').upsert(panPush, { onConflict: 'id' });
    if (error) throw new Error(`pantry push: ${error.message}`);
    pushed += panPush.length;
  }
  for (const w of remotePan) {
    const local = localPanById.get(w.id);
    const remoteNewer = !local || Date.parse(w.updated_at) > Date.parse(local.addedAt);
    if (panPush.some(p => p.id === w.id)) continue;
    if (!remoteNewer) continue;
    if (!isEnvelope(w.body)) { skipped++; continue; }
    try {
      const d = await decryptJson(key, w.body);
      const name = str(member(d, 'name')); const addedAt = str(member(d, 'addedAt'));
      if (!name || !addedAt) { skipped++; continue; }
      const brand = str(member(d, 'brand')); const note = str(member(d, 'note')); const catRaw = member(d, 'category');
      const category: HouseholdCategory = isCategory(catRaw) ? catRaw : 'other';
      const expRaw = member(d, 'expiresAt');
      const expiresAt = typeof expRaw === 'string' && ISO_DATE.test(expRaw) ? expRaw : null;
      await putItem({ id: w.id, name, brand, category, note, addedAt, ...(expiresAt ? { expiresAt } : {}) });
      pulled++;
    } catch { skipped++; }
  }

  const plan = (await fetchServerPlan()) ?? 'free';
  safeSet(LAST_SYNC_KEY, pushStamp);
  return { pushed, pulled, skipped, plan };
};

/** Claim an invited household seat on this account (RPC; idempotent). */
export const claimSeat = async (): Promise<void> => { await supabase()?.rpc('claim_household_seat'); };
