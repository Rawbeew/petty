/* Photo evidence — attached to a scope (a household item, the food-fraud file…).
 * Bytes live in IndexedDB on THIS device only. Rendering, download, delete. */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, Download, Trash2, ShieldAlert } from 'lucide-react';
import { isStorageAvailable, listPhotos, addPhoto, deletePhoto, type EvidencePhoto } from '../lib/household';

export default function PhotoEvidence({ scope }: { scope: string }) {
  const inputId = useId();
  const [photos, setPhotos] = useState<EvidencePhoto[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const storageOk = isStorageAvailable();
  const urlsRef = useRef<Record<string, string>>({});

  const applyRows = useCallback((rows: EvidencePhoto[]) => {
    Object.values(urlsRef.current).forEach(u => { URL.revokeObjectURL(u); });
    const map: Record<string, string> = {};
    for (const photo of rows) map[photo.id] = URL.createObjectURL(photo.blob);
    urlsRef.current = map;
    setPhotos(rows); setUrls(map); setError('');
  }, []);

  const reload = useCallback(async () => {
    try { applyRows(await listPhotos(scope)); }
    catch { setError('Local storage refused — attach this evidence somewhere else or export first.'); setPhotos([]); }
  }, [scope, applyRows]);

  useEffect(() => {
    const box = { alive: true };
    void (async () => {
      try { const rows = await listPhotos(scope); if (box.alive) { applyRows(rows); } }
      catch { if (box.alive) { setError('Local storage refused — attach this evidence somewhere else or export first.'); setPhotos([]); } }
    })();
    return () => { box.alive = false; Object.values(urlsRef.current).forEach(u => { URL.revokeObjectURL(u); }); urlsRef.current = {}; };
  }, [scope, applyRows]);

  const onAttach = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) { setError('Images only — keep PDFs with the letters, not here.'); continue; }
        await addPhoto(scope, f);
      }
      await reload();
    } catch { setError('Could not save photo locally.'); }
  };

  const onDelete = async (id: string) => { await deletePhoto(id).catch(() => { setError('Delete failed.'); }); await reload(); };

  if (!storageOk) return (
    <div className="rounded-xl border border-[rgba(255,90,90,0.35)] p-3 flex items-start gap-2 text-[10px] text-[#e6a2a2]">
      <ShieldAlert size={12} className="mt-0.5 shrink-0" aria-hidden />Local storage is unavailable (private browsing?) — evidence photos cannot be saved on this device. Use another browser or keep originals somewhere safe.
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="mono text-[8px] tracking-[0.25em] text-[var(--dim)]">EVIDENCE — ON THIS DEVICE ONLY ({photos?.length ?? '–'})</span>
        <label htmlFor={inputId} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line2)] px-3 py-1.5 mono text-[8px] tracking-[0.2em] uppercase text-[var(--dim)] hover:text-[var(--ink)] hover:border-[var(--gold)] cursor-pointer transition-colors"><Camera size={11} />Attach photo</label>
        <input id={inputId} type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={e => { void onAttach(e.target.files); e.target.value = ''; }} />
      </div>
      {error && <p className="mono text-[8px] text-[#e6a2a2]">{error}</p>}
      {photos && photos.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map(p => (
            <li key={p.id} className="relative group rounded-lg overflow-hidden border border-[var(--line2)] aspect-square bg-[var(--panel2)]">
              {urls[p.id] && <img src={urls[p.id]} alt={`Evidence taken ${new Date(p.addedAt).toLocaleDateString()}`} className="w-full h-full object-cover" />}
              <span className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 mono text-[7px] text-white/85 flex items-center justify-between gap-1">{new Date(p.addedAt).toLocaleDateString()} · {(p.size / 1024).toFixed(0)}KB
                <span className="flex items-center gap-1 shrink-0">
                  <a href={urls[p.id]} download={`petty-evidence-${p.id.slice(0, 8)}.jpg`} aria-label="Download photo" className="p-0.5 hover:text-[var(--gold)]"><Download size={10} /></a>
                  <button onClick={() => { void onDelete(p.id); }} aria-label="Delete photo" className="p-0.5 hover:text-[#ff5a5a]"><Trash2 size={10} /></button>
                </span></span>
            </li>
          ))}
        </ul>
      )}
      <p className="mono text-[7px] text-[var(--dim)] leading-relaxed">Never uploaded — there is no server. Clearing browser data erases these. Download anything you need before you need it.</p>
    </div>
  );
}
