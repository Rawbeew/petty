/* Petty — on-device household ledger + evidence photos. NOTHING leaves this device:
 * no server exists to receive these bytes. IndexedDB, origin-scoped, no account.
 * If the browser evicts or the user clears site data, the ledger is gone — export matters. */

export type HouseholdCategory = 'food' | 'drug' | 'device' | 'cosmetic' | 'other';
export interface HouseholdItem {
  id: string; name: string; brand: string; category: HouseholdCategory;
  note: string; addedAt: string;
}
export interface EvidencePhoto {
  id: string; scope: string; blob: Blob; mime: string; size: number; addedAt: string;
}

const DB_NAME = 'petty-household';
const DB_VERSION = 1;
const ITEMS = 'items';
const PHOTOS = 'photos';
const SCOPE_INDEX = 'scope';

export const isStorageAvailable = (): boolean => typeof window !== 'undefined' && 'indexedDB' in window;

const newId = (): string => {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
};

const openDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!isStorageAvailable()) { reject(new Error('indexeddb-unavailable')); return; }
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(ITEMS)) db.createObjectStore(ITEMS, { keyPath: 'id' });
    if (!db.objectStoreNames.contains(PHOTOS)) {
      const s = db.createObjectStore(PHOTOS, { keyPath: 'id' });
      s.createIndex(SCOPE_INDEX, 'scope', { unique: false });
    }
  };
  req.onsuccess = () => { resolve(req.result); };
  req.onerror = () => { reject(req.error ?? new Error('indexeddb-open-failed')); };
});

const tx = (db: IDBDatabase, stores: string[], mode: IDBTransactionMode, run: (t: IDBTransaction) => IDBRequest[]): Promise<unknown[]> =>
  new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const reqs = run(t);
    const out: unknown[] = [];
    reqs.forEach(r => { r.onsuccess = () => { out.push(r.result); }; });
    t.oncomplete = () => { resolve(out); };
    t.onerror = () => { reject(t.error ?? new Error('indexeddb-tx-failed')); };
    t.onabort = () => { reject(t.error ?? new Error('indexeddb-tx-aborted')); };
  });

const isItem = (v: unknown): v is HouseholdItem => {
  if (typeof v !== 'object' || v === null) return false;
  if (!('id' in v) || !('name' in v) || !('brand' in v) || !('category' in v) || !('note' in v) || !('addedAt' in v)) return false;
  return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.brand === 'string' && typeof v.category === 'string' && typeof v.note === 'string' && typeof v.addedAt === 'string';
};
const isPhoto = (v: unknown): v is EvidencePhoto => {
  if (typeof v !== 'object' || v === null) return false;
  if (!('id' in v) || !('scope' in v) || !('addedAt' in v) || !('blob' in v)) return false;
  return typeof v.id === 'string' && typeof v.scope === 'string' && typeof v.addedAt === 'string' && v.blob instanceof Blob;
};

export const itemScope = (itemId: string): string => `item:${itemId}`;

export async function listItems(): Promise<HouseholdItem[]> {
  const db = await openDb();
  try {
    const [rows] = await tx(db, [ITEMS], 'readonly', t => [t.objectStore(ITEMS).getAll()]);
    const items = (Array.isArray(rows) ? rows.filter(isItem) : []);
    return [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  } finally { db.close(); }
}

export async function putItem(item: HouseholdItem): Promise<void> {
  const db = await openDb();
  try {
    await tx(db, [ITEMS], 'readwrite', t => [t.objectStore(ITEMS).put(item)]);
  } finally { db.close(); }
}

export async function deleteItem(itemId: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction([ITEMS, PHOTOS], 'readwrite');
      t.objectStore(ITEMS).delete(itemId);
      const idx = t.objectStore(PHOTOS).index(SCOPE_INDEX);
      const cur = idx.openCursor(IDBKeyRange.only(itemScope(itemId)));
      cur.onsuccess = () => { const c = cur.result; if (c) { c.delete(); c.continue(); } };
      t.oncomplete = () => { resolve(); };
      t.onerror = () => { reject(t.error ?? new Error('delete-failed')); };
    });
  } finally { db.close(); }
}

export async function listPhotos(scope: string): Promise<EvidencePhoto[]> {
  const db = await openDb();
  try {
    const [rows] = await tx(db, [PHOTOS], 'readonly', t => [t.objectStore(PHOTOS).index(SCOPE_INDEX).getAll(IDBKeyRange.only(scope))]);
    const photos = (Array.isArray(rows) ? rows.filter(isPhoto) : []);
    return [...photos].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  } finally { db.close(); }
}

export async function addPhoto(scope: string, file: File): Promise<void> {
  const db = await openDb();
  try {
    const rec: EvidencePhoto = { id: newId(), scope, blob: file, mime: file.type || 'image/jpeg', size: file.size, addedAt: new Date().toISOString() };
    await tx(db, [PHOTOS], 'readwrite', t => [t.objectStore(PHOTOS).put(rec)]);
  } finally { db.close(); }
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  try {
    await tx(db, [PHOTOS], 'readwrite', t => [t.objectStore(PHOTOS).delete(id)]);
  } finally { db.close(); }
}

/* Ask the browser to keep our data. Best-effort; result surfaced to the UI. */
export type PersistStatus = 'persisted' | 'prompt' | 'unsupported';
export async function requestPersistence(): Promise<PersistStatus> {
  try {
    const s = navigator.storage;
    if (typeof s.persisted === 'function' && await s.persisted()) return 'persisted';
    if (typeof s.persist === 'function' && await s.persist()) return 'persisted';
    return 'prompt';
  } catch { return 'unsupported'; }
}

export const newItem = (name: string, brand: string, category: HouseholdCategory, note: string): HouseholdItem =>
  ({ id: newId(), name: name.trim(), brand: brand.trim(), category, note: note.trim(), addedAt: new Date().toISOString() });
