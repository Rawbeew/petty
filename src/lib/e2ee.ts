/* Petty — client-side vault encryption (AES-256-GCM) for optional account sync.
 *
 * Trust model: the server stores OPAQUE BYTES. It never sees titles, names or notes.
 * Key = PBKDF2(passphrase, salt=profile.sync_salt, 250k SHA-256 iterations) → AES-GCM-256.
 * The salt is public (stored on the profile row) — it salts derivation, it does not hide it.
 * Lose the passphrase → the ciphertext is unrecoverable. That is the point of E2EE.
 */

const te = new TextEncoder();
const td = new TextDecoder();

const b64 = (buf: ArrayBuffer): string => {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i += 1) s += String.fromCharCode(bytes[i] ?? 0);
  return btoa(s);
};
const unb64 = (s: string): Uint8Array => {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

export interface Envelope { v: 1; iv: string; ct: string; }

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
};

export const deriveVaultKey = async (passphrase: string, saltHex: string): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey('raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: 250_000 },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const encryptJson = async (key: CryptoKey, value: unknown): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, te.encode(JSON.stringify(value)));
  const env: Envelope = { v: 1, iv: b64(iv.buffer), ct: b64(ct) };
  return JSON.stringify(env);
};

const member = (v: unknown, key: string): unknown => (typeof v === 'object' && v !== null ? Reflect.get(v, key) as unknown : undefined);

const parseEnvelope = (wire: string): Envelope => {
  const raw: unknown = JSON.parse(wire);
  const v = member(raw, 'v'); const iv = member(raw, 'iv'); const ct = member(raw, 'ct');
  if (v !== 1 || typeof iv !== 'string' || typeof ct !== 'string') throw new Error('envelope-unsupported');
  return { v: 1, iv, ct };
};

export const decryptJson = async (key: CryptoKey, wire: string): Promise<unknown> => {
  const env = parseEnvelope(wire);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(env.iv) },
    key,
    unb64(env.ct),
  );
  return JSON.parse(td.decode(plain)) as unknown; /* JSON.parse returns any — unknown is the honest container */
};

export const newSaltHex = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

export const isEnvelope = (wire: unknown): boolean =>
  typeof wire === 'string' && wire.includes('"v":1') && wire.includes('"iv"') && wire.includes('"ct"');
