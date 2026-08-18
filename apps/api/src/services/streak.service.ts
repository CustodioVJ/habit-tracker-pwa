import { FrequencyConfig, StreakInfo } from '@habit/shared';
import { addDays, diffDays, dayOfWeek, todayString } from '../lib/dates';

/**
 * Pure streak-calculation logic. Kept free of database access so it can be
 * unit tested exhaustively with synthetic data.
 *
 * A "streak" is a run of consecutive *due* periods in which the habit was
 * completed. The definition of "due" depends on the habit's frequency:
 *
 *  - daily: every calendar day is due.
 *  - specific_days: only the configured weekdays are due.
 *  - weekly (X times/week): the habit is due on any day, but only X
 *    completions count per ISO week. A week is "complete" when X check-ins
 *    exist in it; the streak advances week by week.
 */

/** Returns true if the given date is a "due" day for the habit. */
export function isDueDate(date: string, config: FrequencyConfig): boolean {
  switch (config.type) {
    case 'daily':
      return true;
    case 'specific_days':
      return config.days.includes(dayOfWeek(date));
    case 'weekly':
      // Weekly habits are due every day; completion is measured per week.
      return true;
    default:
      return true;
  }
}

/**
 * Compute current and longest streaks for a habit.
 *
 * @param startDate  The habit's start date (YYYY-MM-DD).
 * @param config     The habit's frequency configuration.
 * @param completed  Sorted list of completed check-in dates (YYYY-MM-DD).
 * @param today      Reference "today" date (YYYY-MM-DD), injectable for tests.
 */
export function computeStreaks(
  startDate: string,
  config: FrequencyConfig,
  completed: string[],
  today: string = todayString(),
): StreakInfo {
  const completedSet = new Set(completed);

  if (config.type === 'weekly') {
    return computeWeeklyStreaks(startDate, config, completedSet, today);
  }

  // daily and specific_days share the same day-by-day logic.
  return computeDayStreaks(startDate, config, completedSet, today);
}

/** Day-by-day streak logic for daily and specific_days habits. */
function computeDayStreaks(
  startDate: string,
  config: FrequencyConfig,
  completedSet: Set<string>,
  today: string,
): StreakInfo {
  // Walk backwards from today to find the current streak. An unfinished due
  // day does not break the streak until that day has passed, matching the
  // dashboard's active-day streak behavior.
  let current = 0;
  let cursor = isDueDate(today, config) && !completedSet.has(today) ? addDays(today, -1) : today;

  // The current streak may include today when completed, or remain anchored
  // on the most recent completed due day while today's opportunity is open.
  let streakBroken = false;
  let lastCompletedDate: string | null = null;

  // Guard against infinite loops: cap at a large number of days.
  const maxDays = 366 * 10;

  for (let i = 0; i < maxDays; i++) {
    if (cursor < startDate) break;

    const due = isDueDate(cursor, config);
    const done = completedSet.has(cursor);

    if (due) {
      if (done) {
        current++;
        if (!lastCompletedDate) lastCompletedDate = cursor;
        // Continue to previous day.
      } else {
        // A due day was missed. The streak is broken.
        streakBroken = true;
        break;
      }
    }
    // Non-due days are skipped without breaking the streak.
    cursor = addDays(cursor, -1);
  }

  // If the streak was never broken and we reached the start date, the current
  // streak is the number of consecutive due days completed up to today.
  // If today is not due yet, current may be 0 even though the streak is alive;
  // that's acceptable — the streak resumes when the next due day is completed.

  // Compute the longest streak by scanning forward from the start date.
  let longest = 0;
  let run = 0;
  let runLastCompleted: string | null = null;
  let longestLastCompleted: string | null = null;

  let day = startDate;
  for (let i = 0; i < maxDays; i++) {
    if (day > today) break;
    const due = isDueDate(day, config);
    const done = completedSet.has(day);

    if (due) {
      if (done) {
        run++;
        runLastCompleted = day;
        if (run > longest) {
          longest = run;
          longestLastCompleted = day;
        }
      } else {
        run = 0;
        runLastCompleted = null;
      }
    }
    day = addDays(day, 1);
  }

  // If the current streak is still running (not broken), use the forward scan
  // result for the current streak too, so it reflects the true consecutive run.
  if (!streakBroken && current === 0 && run > 0) {
    current = run;
    lastCompletedDate = runLastCompleted;
  }

  return {
    current,
    longest,
    lastCompletedDate: longestLastCompleted ?? lastCompletedDate,
  };
}

/** Weekly streak logic for habits with a "X times per week" frequency. */
function computeWeeklyStreaks(
  startDate: string,
  config: FrequencyConfig,
  completedSet: Set<string>,
  today: string,
): StreakInfo {
  const timesPerWeek = config.type === 'weekly' ? config.timesPerWeek : 1;

  // Group completed dates by ISO week.
  const completionsByWeek = new Map<string, number>();
  for (const date of completedSet) {
    if (date < startDate) continue;
    const week = isoWeekKey(date);
    completionsByWeek.set(week, (completionsByWeek.get(week) ?? 0) + 1);
  }

  // A week is "complete" if it has at least timesPerWeek completions.
  const isWeekComplete = (week: string): boolean =>
    (completionsByWeek.get(week) ?? 0) >= timesPerWeek;

  // Determine the current week key.
  const currentWeek = isoWeekKey(today);

  // Walk backwards from the current week to find the current streak.
  let current = 0;
  let weekCursor = currentWeek;
  let lastCompletedDate: string | null = null;

  // The current week counts toward the streak if it's already complete.
  // If the current week is not yet complete, we don't break the streak — the
  // user may still complete it. So we start counting from the previous week.
  let started = isWeekComplete(currentWeek);
  if (!started) {
    weekCursor = previousWeekKey(currentWeek);
  }

  for (let i = 0; i < 520; i++) {
    if (weekCursor < isoWeekKey(startDate)) break;
    if (isWeekComplete(weekCursor)) {
      current++;
      if (!lastCompletedDate) lastCompletedDate = lastDayOfWeek(weekCursor);
      weekCursor = previousWeekKey(weekCursor);
    } else {
      break;
    }
  }

  // Longest streak: scan forward week by week from the start.
  let longest = 0;
  let run = 0;
  let longestLastCompleted: string | null = null;
  let week = isoWeekKey(startDate);

  for (let i = 0; i < 520; i++) {
    if (week > currentWeek) break;
    if (isWeekComplete(week)) {
      run++;
      longestLastCompleted = lastDayOfWeek(week);
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
    week = nextWeekKey(week);
  }

  return {
    current,
    longest,
    lastCompletedDate: longestLastCompleted ?? lastCompletedDate,
  };
}

/** ISO week key in the form YYYY-Www. */
function isoWeekKey(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const dayNr = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayNr + 3);
  const firstThursday = date.getTime();
  date.setMonth(0, 1);
  if (date.getDay() !== 4) {
    date.setMonth(0, 1 + ((4 - date.getDay() + 7) % 7));
  }
  const week = 1 + Math.ceil((firstThursday - date.getTime()) / (7 * 24 * 3600 * 1000));
  const year = date.getFullYear();
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function previousWeekKey(weekKey: string): string {
  const [year, week] = weekKey.split('-W').map(Number);
  if (week === 1) {
    return `${year - 1}-W52`;
  }
  return `${year}-W${String(week - 1).padStart(2, '0')}`;
}

function nextWeekKey(weekKey: string): string {
  const [year, week] = weekKey.split('-W').map(Number);
  if (week === 52) {
    return `${year + 1}-W01`;
  }
  return `${year}-W${String(week + 1).padStart(2, '0')}`;
}

/** The Sunday (last day) of the ISO week containing the given date. */
function lastDayOfWeek(weekKey: string): string {
  const [year, week] = weekKey.split('-W').map(Number);
  // Approximate: find the Thursday of the week, then add 3 days.
  const jan4 = new Date(year, 0, 4);
  const dayNr = (jan4.getDay() + 6) % 7;
  jan4.setDate(jan4.getDate() - dayNr + 3);
  const thursday = new Date(jan4);
  thursday.setDate(thursday.getDate() + (week - 1) * 7);
  const sunday = new Date(thursday);
  sunday.setDate(sunday.getDate() + 3);
  return sunday.toISOString().slice(0, 10);
}

/** Number of due days between two dates (inclusive) for a frequency config. */
export function countDueDays(start: string, end: string, config: FrequencyConfig): number {
  let count = 0;
  let day = start;
  const maxDays = 366 * 5;
  for (let i = 0; i < maxDays; i++) {
    if (day > end) break;
    if (isDueDate(day, config)) count++;
    day = addDays(day, 1);
  }
  return count;
}

/** Number of completed due days between two dates (inclusive). */
export function countCompletedDueDays(
  start: string,
  end: string,
  config: FrequencyConfig,
  completedSet: Set<string>,
): number {
  let count = 0;
  let day = start;
  const maxDays = 366 * 5;
  for (let i = 0; i < maxDays; i++) {
    if (day > end) break;
    if (isDueDate(day, config) && completedSet.has(day)) count++;
    day = addDays(day, 1);
  }
  return count;
}

/** Difference in days helper re-exported for convenience. */
export { diffDays };
