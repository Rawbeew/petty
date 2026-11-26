/* The Clockwatch — deadlines watched on-device. No notifications, no account,
 * no server: a list the human checks, because the law does not remind you twice. */
import { useEffect, useState } from 'react';
import { AlarmClock, Trash2, Plus, Check } from 'lucide-react';
import { SectionHeader } from './ui/SectionHeader';
import { cx } from '../lib/ui';
import { loadReminders, addReminder, toggleReminder, removeReminder, clearDone, subscribeReminders, daysUntilDue, sortedByDue } from '../lib/reminders';
import { clockwatchCapHit, CLOCKWATCH_FREE_CAP } from '../config/billing';

export default function Clockwatch() {
  const [list, setList] = useState(() => loadReminders());
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => subscribeReminders(() => { setList(sortedByDue(loadReminders())); }), []);

  const active = list.filter(r => !r.done).length;
  const capped = clockwatchCapHit(active);
  const add = () => { if (capped || !title.trim() || !date) return; addReminder(title, date, 'manual'); setTitle(''); setDate(''); setList(sortedByDue(loadReminders())); };
  const doneCount = list.filter(r => r.done).length;

  return (
    <section className="panel p-5 space-y-4">
      <SectionHeader icon={AlarmClock} kicker="Clockwatch — on this device" title="Deadlines don't expire silently." right={list.length > 0 ? <span className="chip chip-gold">{list.filter(r => !r.done).length} OPEN</span> : undefined} />
      {capped && <p className="mono text-[8.5px] text-[var(--gold)] border border-[rgba(242,193,78,0.35)] rounded-xl px-3 py-2">FREE CAP REACHED — {CLOCKWATCH_FREE_CAP} OPEN CLOCKS. THE LAW STAYS FREE; THE FILING CABINET UNLOCKS WITH THE HOUSEHOLD PLAN ($9/MO · $79/YR, 6 SEATS). COMPLETED CLOCKS DON’T COUNT — CLEAR THEM TO ADD MORE.</p>}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2.5 items-end">
        <input className="field" placeholder="e.g. Deposit — 14-day statutory return (NY)" value={title} onChange={e => { setTitle(e.target.value); }} aria-label="Reminder title" />
        <input className="field" type="date" value={date} onChange={e => { setDate(e.target.value); }} aria-label="Due date" />
        <button onClick={add} disabled={capped || !title.trim() || !date} className="rounded-xl bg-[var(--gold)] text-black font-bold h-[42px] px-4 mono text-[9px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)] disabled:opacity-40 inline-flex items-center gap-1.5"><Plus size={12} />Watch</button>
      </div>
      <ul className="space-y-1.5">
        {sortedByDue(list).map(r => {
          const days = daysUntilDue(r.dueAt);
          const tone = r.done ? 'text-[var(--dim)]' : days < 0 ? 'text-[#ff8a8a]' : days <= 7 ? 'text-[var(--gold)]' : 'text-[var(--dim)]';
          return (
            <li key={r.id} className="flex items-center gap-2.5 rounded-xl border border-[var(--line2)] px-3 py-2.5">
              <button onClick={() => { toggleReminder(r.id); setList(sortedByDue(loadReminders())); }} aria-label={r.done ? 'Mark not done' : 'Mark done'} className={cx('h-5 w-5 shrink-0 rounded-md border flex items-center justify-center', r.done ? 'border-[var(--green)] bg-[rgba(61,220,151,0.15)] text-[var(--green)]' : 'border-[var(--line2)] text-transparent')}><Check size={13} /></button>
              <div className="min-w-0 flex-1">
                <p className={cx('text-[11px] leading-snug', r.done ? 'line-through opacity-60 text-[var(--dim)]' : 'text-[var(--ink)]')}>{r.title}</p>
                <p className="mono text-[8px] text-[var(--dim)] mt-0.5">due {r.dueAt} · {r.source}</p>
              </div>
              {!r.done && <span className={cx('mono text-[9px] shrink-0', tone)}>{days < 0 ? `${-days}d OVERDUE` : days === 0 ? 'TODAY' : `${days}d left`}</span>}
              <button onClick={() => { removeReminder(r.id); setList(sortedByDue(loadReminders())); }} aria-label="Delete reminder" className="p-1.5 text-[var(--dim)] hover:text-[#ff5a5a] shrink-0"><Trash2 size={13} /></button>
            </li>
          );
        })}
        {list.length === 0 && <li className="mono text-[9px] text-[var(--dim)] text-center py-4">Nothing watched yet. Your deposit packet and complaint letters can add their own clocks — or type one above.</li>}
      </ul>
      {doneCount > 0 && <button onClick={() => { setList(sortedByDue(clearDone())); }} className="mono text-[8px] text-[var(--dim)] hover:text-[var(--ink)] underline underline-offset-2">Clear {doneCount} completed</button>}
      <p className="mono text-[8px] text-[var(--dim)]">No notifications exist and none are coming — this is a list on this device, not a subscription. Check it the way the statute gets checked: before it lapses.</p>
    </section>
  );
}
