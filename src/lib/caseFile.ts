/* Petty — the case file. ONE shared narrative across scanner → pantry → desk, on this device.
 * Persisted to localStorage (text only, tiny, origin-scoped). Photos live in IndexedDB under scope 'case'.
 * Nothing here leaves the device; nothing here is sent anywhere. Clear = erase. */
import { createContext, useContext } from 'react';
import { safeGet } from './safeStorage';

export interface CaseFile {
  product: string; business: string; date: string; what: string; ill: boolean; updatedAt: string | null;
}
export const EMPTY: CaseFile = { product: '', business: '', date: '', what: '', ill: false, updatedAt: null };
export const KEY = 'petty.casefile.v1';

export interface CaseContextValue {
  c: CaseFile;
  set: <K extends keyof CaseFile>(key: K, value: CaseFile[K]) => void;
  clear: () => void;
  beginFromItem: (item: { name: string; brand: string; category: string }) => void;
  goComplaint: (() => void) | undefined;
}

export const CaseContext = createContext<CaseContextValue | null>(null);

export const readStored = (): CaseFile => {
  try {
    const raw = safeGet(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const p = parsed as Partial<CaseFile>;
    return {
      product: typeof p.product === 'string' ? p.product : '',
      business: typeof p.business === 'string' ? p.business : '',
      date: typeof p.date === 'string' ? p.date : '',
      what: typeof p.what === 'string' ? p.what : '',
      ill: p.ill === true,
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : null,
    };
  } catch { return EMPTY; }
};

export function useCaseFile(): CaseContextValue {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCaseFile must be used inside <CaseProvider>');
  return ctx;
}
