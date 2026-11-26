/* Petty — E2EE vault: roundtrip, salt, tamper. No network. */
import { deriveVaultKey, encryptJson, decryptJson, newSaltHex, isEnvelope } from '../src/lib/e2ee';

let failures = 0;
const ok = (c: boolean, label: string) => { console.log((c ? 'PASS' : 'FAIL'), '-', label); if (!c) failures++; };

const run = async () => {
  const salt = newSaltHex();
  ok(/^[0-9a-f]{32}$/.test(salt), 'salt is 16 random bytes, hex');
  const key1 = await deriveVaultKey('correct horse battery staple', salt);
  const key2 = await deriveVaultKey('correct horse battery staple', salt);
  const key3 = await deriveVaultKey('wrong passphrase entirely', salt);

  const sealed = await encryptJson(key1, { title: 'Deposit — 14-day return', amount: 2000 });
  ok(isEnvelope(sealed), 'envelope shape recognized');
  ok(!sealed.includes('Deposit'), 'ciphertext does not contain the plaintext');

  const get = (o: unknown, k: string): unknown => (typeof o === 'object' && o !== null ? Reflect.get(o, k) as unknown : undefined);
  const opened: unknown = await decryptJson(key2, sealed);
  const oTitle = get(opened, 'title');
  const oAmount = get(opened, 'amount');
  ok(oTitle === 'Deposit — 14-day return' && oAmount === 2000, 'roundtrip with same passphrase + salt');

  let threw = false;
  try { await decryptJson(key3, sealed); } catch { threw = true; }
  ok(threw, 'wrong passphrase cannot decrypt');

  const envRaw: unknown = JSON.parse(sealed);
  const iv = get(envRaw, 'iv');
  const ct = get(envRaw, 'ct');
  const tamperedWire = JSON.stringify({ v: 1, iv, ct: String(ct).slice(0, -4) + 'AAAA' });
  let tampered = false;
  try { await decryptJson(key1, tamperedWire); } catch { tampered = true; }
  ok(tampered, 'bit-flipped ciphertext fails integrity (GCM tag)');

  console.log(failures === 0 ? '\ne2ee: all assertions passed' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
};
void run();
