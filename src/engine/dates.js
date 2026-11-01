// All game days are Sydney calendar days, written as YYYY-MM-DD.
export const TZ = 'Australia/Sydney';

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const hourFmt = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: 'numeric', hour12: false });

let offsetDays = 0; // practice mode can jump forward in time
export function setDayOffset(n) { offsetDays = n; }
export function getDayOffset() { return offsetDays; }

export function today(now = Date.now()) {
  return addDays(fmt.format(new Date(now)), offsetDays);
}
export function hourNow(now = Date.now()) {
  return Number(hourFmt.format(new Date(now))) % 24;
}

// Date arithmetic on plain YYYY-MM-DD strings (UTC noon avoids DST edges).
function toUTC(d) { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd, 12); }
function fromUTC(t) { return new Date(t).toISOString().slice(0, 10); }
export function addDays(d, n) { return fromUTC(toUTC(d) + n * 86400000); }
export function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
export function weekday(d) { return new Date(toUTC(d)).getUTCDay(); } // 0 = Sunday
export function weekStart(d) { const w = weekday(d); return addDays(d, w === 0 ? -6 : 1 - w); } // Monday
export function weekEnd(d) { return addDays(weekStart(d), 6); } // Sunday
export function isSunday(d) { return weekday(d) === 0; }
export function daysLeftInWeek(d) { return daysBetween(d, weekEnd(d)) + 1; } // including d

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function dayName(d) { return DAY_NAMES[weekday(d)]; }
export function prettyDate(d) {
  return new Date(toUTC(d)).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}
