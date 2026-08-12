import { DashboardData } from '@habit/shared';
import { prisma } from '../lib/prisma';
import { listHabits } from './habit.service';
import { listCategories } from './category.service';
import { getAggregateCompletionRate } from './stats.service';
import { todayString, startOfWeek, addDays, toDateString } from '../lib/dates';

/**
 * Compute the user-level "active day" streaks from a set of dates on which the
 * user completed at least one habit. Streaks are measured in consecutive days,
 * not per-habit.
 */
function computeDayStreaks(activeDays: Set<string>, today: string) {
  // Anchor the current streak on today if active, otherwise on yesterday.
  let cursor = activeDays.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (activeDays.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest streak: walk the sorted active days counting consecutive runs.
  const sorted = [...activeDays].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }

  return { current, longest };
}

/** Build the dashboard payload for a user. */
export async function getDashboard(userId: string): Promise<DashboardData> {
  const [habits, categories, weekCompletionRate, monthCompletionRate] = await Promise.all([
    listHabits(userId),
    listCategories(userId),
    getAggregateCompletionRate(userId, 'week'),
    getAggregateCompletionRate(userId, 'month'),
  ]);

  const today = todayString();
  const weekStart = startOfWeek(today);

  // Collect every distinct day on which the user completed at least one habit.
  const checkIns = await prisma.checkIn.findMany({
    where: {
      completed: true,
      habit: { userId, isArchived: false },
    },
    select: { date: true },
  });
  const activeDays = new Set(checkIns.map((c) => toDateString(c.date)));

  const { current, longest } = computeDayStreaks(activeDays, today);

  // Count distinct days this week (up to today) with at least one completion.
  let completedThisWeek = 0;
  let day = weekStart;
  while (day <= today) {
    if (activeDays.has(day)) completedThisWeek += 1;
    day = addDays(day, 1);
  }

  const stats = {
    totalHabits: habits.length,
    totalCurrentStreak: current,
    totalLongestStreak: longest,
    completedToday: habits.filter((h) => h.todayCompleted).length,
    completedThisWeek,
  };

  return {
    habits,
    categories,
    today,
    weekCompletionRate,
    monthCompletionRate,
    stats,
  };
}
