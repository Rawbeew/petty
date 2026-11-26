/* Petty — on-device clockwatch. Deadline reminders with NO account, NO push, NO server.
 * Text only (localStorage via safeStorage). Honestly labeled: this list does not notify;
 * it is checked by the human it belongs to. */
import { safeGet, safeSet } from './safeStorage';

export type ReminderSource = 'deposit' | 'complaint' | 'manual';
export interface Reminder {
  id: string; title: string; dueAt: string; /* ISO date YYYY-MM-DD */
  source: ReminderSource; done: boolean; createdAt: string;
}

const KEY = 'petty.reminders.v1';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* same-bundle listener registry — no DOM, no window, works in tests too */
type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribeReminders = (fn: Listener): (() => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const emit = () => { for (const l of [...listeners]) l(); };

const newId = (): string => {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
};

const isReminder = (v: unknown): v is Reminder => {
  if (typeof v !== 'object' || v === null) return false;
  if (!('id' in v) || !('title' in v) || !('dueAt' in v) || !('source' in v) || !('done' in v) || !('createdAt' in v)) return false;
  return typeof v.id === 'string' && typeof v.title === 'string' && typeof v.dueAt === 'string' && ISO_DATE.test(v.dueAt) && typeof v.createdAt === 'string' && (v.source === 'deposit' || v.source === 'complaint' || v.source === 'manual') && typeof v.done === 'boolean';
};

export const loadReminders = (): Reminder[] => {
  const raw = safeGet(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isReminder) : [];
  } catch { return []; }
};

const persist = (list: Reminder[]): boolean => {
  const ok = safeSet(KEY, JSON.stringify(list));
  if (ok) emit();
  return ok;
};

export const addReminder = (title: string, dueAt: string, source: ReminderSource = 'manual'): Reminder | null => {
  if (!title.trim() || !ISO_DATE.test(dueAt)) return null;
  const r: Reminder = { id: newId(), title: title.trim(), dueAt, source, done: false, createdAt: new Date().toISOString() };
  return persist([...loadReminders(), r]) ? r : null;
};
/* Idempotent by id — used by account sync pulls; validates like addReminder. */
export const upsertReminder = (r: Reminder): boolean => {
  if (!isReminder(r)) return false;
  const rest = loadReminders().filter(x => x.id !== r.id);
  return persist([...rest, r]);
};

export const toggleReminder = (id: string): Reminder[] => { const next = loadReminders().map(r => (r.id === id ? { ...r, done: !r.done } : r)); persist(next); return next; };
export const removeReminder = (id: string): Reminder[] => { const next = loadReminders().filter(r => r.id !== id); persist(next); return next; };
export const clearDone = (): Reminder[] => { const next = loadReminders().filter(r => !r.done); persist(next); return next; };

/* whole-day difference vs today (local midnight); negative = overdue */
export const daysUntilDue = (dueAt: string, now: Date = new Date()): number => {
  const parts = dueAt.split('-').map(Number);
  const y = parts[0] ?? 1970, m = parts[1] ?? 1, d = parts[2] ?? 1;
  const due = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86_400_000);
};

export const sortedByDue = (list: Reminder[]): Reminder[] =>
  [...list].sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.createdAt.localeCompare(b.createdAt));
