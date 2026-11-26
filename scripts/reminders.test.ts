/* Petty — clockwatch engine: validation, math, sorting. No DOM, no storage backend. */
import { daysUntilDue, sortedByDue, type Reminder } from '../src/lib/reminders';

let failures = 0;
const ok = (cond: boolean, label: string) => { console.log((cond ? 'PASS' : 'FAIL'), '-', label); if (!cond) failures++; };

const NOW = new Date('2026-11-26T15:00:00');
ok(daysUntilDue('2026-11-26', NOW) === 0, 'due today = 0');
ok(daysUntilDue('2026-11-27', NOW) === 1, 'due tomorrow = +1');
ok(daysUntilDue('2026-11-20', NOW) === -6, 'overdue = negative');
ok(daysUntilDue('2027-01-15', NOW) === 50, 'winter gap crosses month boundary');

const r = (id: string, dueAt: string, createdAt: string): Reminder => ({ id, title: id, dueAt, source: 'manual', done: false, createdAt });
const sorted = sortedByDue([r('b', '2026-12-01', '2026-11-01T00:00:00Z'), r('a', '2026-11-30', '2026-11-02T00:00:00Z'), r('c', '2026-11-30', '2026-11-01T00:00:00Z')]);
ok(sorted.map(x => x.id).join(',') === 'c,a,b', 'sort: dueAt asc, ties by createdAt');

console.log(failures === 0 ? '\nreminders: all assertions passed' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
