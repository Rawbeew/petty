/* Petty — case-file provider (component shell around the on-device store). */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { migratePhotoScopes } from '../lib/household';
import { CaseContext, EMPTY, KEY, readStored, type CaseContextValue, type CaseFile } from '../lib/caseFile';

export function CaseProvider({ children, goComplaint }: { children: ReactNode; goComplaint?: () => void }) {
  const [c, setC] = useState<CaseFile>(readStored);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* full/blocked — session-only */ }
  }, [c]);
  useEffect(() => { void migratePhotoScopes({ complaint: 'case', foodfraud: 'case' }).catch(() => { /* legacy scopes stay; nothing lost */ }); }, []);

  const set = useCallback(<K extends keyof CaseFile>(key: K, value: CaseFile[K]) => {
    setC(prev => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  }, []);
  const clear = useCallback(() => { setC(EMPTY); }, []);
  const beginFromItem = useCallback((item: { name: string; brand: string; category: string }) => {
    setC({
      product: `${item.name}${item.brand ? ` — ${item.brand}` : ''}`,
      business: item.brand,
      date: new Date().toISOString().slice(0, 10),
      what: `Item: ${item.name}${item.brand ? ` — ${item.brand}` : ''} (category: ${item.category}).\n\nWhat happened: `,
      ill: false,
      updatedAt: new Date().toISOString(),
    });
    goComplaint?.();
  }, [goComplaint]);
  const value = useMemo<CaseContextValue>(() => ({ c, set, clear, beginFromItem, goComplaint }), [c, set, clear, beginFromItem, goComplaint]);
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}
