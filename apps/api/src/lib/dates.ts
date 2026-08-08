/**
 * Date utilities. All date handling in the app uses local calendar dates
 * (YYYY-MM-DD) to avoid timezone drift when computing streaks and check-ins.
 */

/** Format a Date as a local YYYY-MM-DD string. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
export function fromDateString(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today's date as a YYYY-MM-DD string in local time. */
export function todayString(): string {
  return toDateString(new Date());
}

/** Add N days to a YYYY-MM-DD string, returning a new YYYY-MM-DD string. */
export function addDays(dateString: string, days: number): string {
  const date = fromDateString(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/** Difference in whole days between two YYYY-MM-DD strings (b - a). */
export function diffDays(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const aDate = fromDateString(a);
  const bDate = fromDateString(b);
  return Math.round((bDate.getTime() - aDate.getTime()) / msPerDay);
}

/** The day of week (0=Sunday ... 6=Saturday) for a YYYY-MM-DD string. */
export function dayOfWeek(dateString: string): number {
  return fromDateString(dateString).getDay();
}

/** The ISO week number for a YYYY-MM-DD string. */
export function isoWeek(dateString: string): number {
  const date = fromDateString(dateString);
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
}

/** The first day (Monday) of the week containing the given date string. */
export function startOfWeek(dateString: string): string {
  const dow = dayOfWeek(dateString); // 0=Sun
  const offset = dow === 0 ? 6 : dow - 1; // days back to Monday
  return addDays(dateString, -offset);
}

/** The first day of the month containing the given date string. */
export function startOfMonth(dateString: string): string {
  return dateString.slice(0, 8) + '01';
}

/** The first day of the year containing the given date string. */
export function startOfYear(dateString: string): string {
  return dateString.slice(0, 4) + '-01-01';
}

/** The last day of the month containing the given date string. */
export function endOfMonth(dateString: string): string {
  const [y, m] = dateString.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/** The last day of the year containing the given date string. */
export function endOfYear(dateString: string): string {
  return dateString.slice(0, 4) + '-12-31';
}
