/* Single source of truth for feed-status semantics.
   Color is semantic, never decorative (P4): green=live/verified, gold=cached/uncertain,
   red=unreachable/risk, slate=gated, cyan=info. */
import { cx } from '../../lib/ui';

export type FeedStatus = 'live' | 'cached' | 'unreachable' | 'gated' | 'portal' | 'bot-walled' | 'unverifiable' | 'queued';

const META: Record<FeedStatus, { label: string; cls: string }> = {
  live: { label: 'WIRED LIVE', cls: 'chip-green' },
  cached: { label: 'CACHED', cls: 'chip-gold' },
  portal: { label: 'PORTAL · 200 OK', cls: 'chip-cyan' },
  'bot-walled': { label: 'BOT-WALLED', cls: 'chip-gold' },
  unverifiable: { label: 'UNVERIFIABLE', cls: 'chip-red' },
  unreachable: { label: 'UNREACHABLE', cls: 'chip-red' },
  gated: { label: 'GATED', cls: 'chip' },
  queued: { label: 'QUEUED', cls: 'chip-gold' },
};

export function StatusChip({ status, className }: { status: FeedStatus; className?: string }) {
  const m = META[status];
  return <span className={cx('chip', m.cls, className)}>{m.label}</span>;
}
