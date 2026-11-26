/* Shared non-component helpers (kept out of components/ for fast-refresh hygiene). */
import { useCallback } from 'react';
import type { Confidence } from '../data/signals';

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

export function useGlow<T extends HTMLElement>() {
  return useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
}

export const CONFIDENCE_META: Record<Confidence, { label: string; cls: string; note: string }> = {
  verified_agency: { label: 'Verified · agency-reported', cls: 'chip-green', note: 'Verbatim from agency feed/portal. Snapshot at ingest time.' },
  anonymized_approx: { label: 'Anonymized · approximate', cls: 'chip-cyan', note: 'Aggregated (≥25 stops/cell, grid-snapped). Never an exact pin.' },
  unconfirmed_dispatch: { label: 'Unconfirmed · dispatch audio', cls: 'chip-red', note: 'Single-source recorded transmission. Await CAD/second-source corroboration.' },
};

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
