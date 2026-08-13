 import { Prisma } from '@prisma/client';
import { HabitStats, HeatmapCell, FrequencyConfig } from '@habit/shared';
import { prisma } from '../lib/prisma';
import { notFound, forbidden } from '../lib/errors';
import {
  isDueDate,
  countDueDays,
  countCompletedDueDays,
  computeStreaks,
} from './streak.service';
import {
  todayString,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfMonth,
  endOfYear,
  addDays,
  toDateString,
} from '../lib/dates';

type Period = 'week' | 'month' | 'year';

/** Compute the date range for a period ending today. */
function periodRange(period: Period, today: string): { start: string; end: string } {
  switch (period) {
    case 'week':
      return { start: startOfWeek(today), end: today };
    case 'month':
      return { start: startOfMonth(today), end: today };
    case 'year':
      return { start: startOfYear(today), end: today };
  }
}

/** Build a heatmap of completion for a habit over a period. */
function buildHeatmap(
  start: string,
  end: string,
  config: FrequencyConfig,
  completedSet: Set<string>,
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  let day = start;
  const maxDays = 366 * 2;
  for (let i = 0; i < maxDays; i++) {
    if (day > end) break;
    const due = isDueDate(day, config);
    const done = completedSet.has(day);
    cells.push({ date: day, completed: due && done, count: done ? 1 : 0 });
    day = addDays(day, 1);
  }
  return cells;
}

/** Get statistics for a single habit over a period. */
export async function getHabitStats(
  habitId: string,
  userId: string,
  period: Period,
): Promise<HabitStats> {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { checkIns: true },
  });
  if (!habit) {
    throw notFound('Habit not found');
  }
  if (habit.userId !== userId) {
    throw forbidden();
  }

  const config = JSON.parse(habit.frequencyConfig) as FrequencyConfig;
  const today = todayString();
  const { start, end } = periodRange(period, today);

  // Clamp the range to the habit's start date.
  const habitStart = toDateString(habit.startDate);
  const effectiveStart = start < habitStart ? habitStart : start;

  const completedSet = new Set(
    habit.checkIns.filter((c) => c.completed).map((c) => toDateString(c.date)),
  );

  const totalDue = countDueDays(effectiveStart, end, config);
  const totalCompleted = countCompletedDueDays(effectiveStart, end, config, completedSet);
  const completionRate = totalDue === 0 ? 0 : Math.round((totalCompleted / totalDue) * 100);

  const heatmap = buildHeatmap(effectiveStart, end, config, completedSet);

  // Streak info is computed over the habit's full history, not just the period.
  const allCompleted = habit.checkIns
    .filter((c) => c.completed)
    .map((c) => toDateString(c.date));
  const streaks = computeStreaks(habitStart, config, allCompleted, today);

  return {
    habitId,
    period,
    totalDue,
    totalCompleted,
    totalCompletions: allCompleted.length,
    completionRate,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    heatmap,
  };
}

/** Get aggregate completion rate across all active habits for a period. */
export async function getAggregateCompletionRate(
  userId: string,
  period: Period,
): Promise<number> {
  const habits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    include: { checkIns: true },
  });

  const today = todayString();
  const { start, end } = periodRange(period, today);

  let totalDue = 0;
  let totalCompleted = 0;

  for (const habit of habits) {
    const config = JSON.parse(habit.frequencyConfig) as FrequencyConfig;
    const habitStart = toDateString(habit.startDate);
    const effectiveStart = start < habitStart ? habitStart : start;
    const completedSet = new Set(
      habit.checkIns.filter((c) => c.completed).map((c) => toDateString(c.date)),
    );
    totalDue += countDueDays(effectiveStart, end, config);
    totalCompleted += countCompletedDueDays(effectiveStart, end, config, completedSet);
  }

  return totalDue === 0 ? 0 : Math.round((totalCompleted / totalDue) * 100);
}

/** Get the full-year heatmap for a habit (GitHub-contributions style). */
export async function getYearHeatmap(habitId: string, userId: string): Promise<HeatmapCell[]> {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { checkIns: true },
  });
  if (!habit) {
    throw notFound('Habit not found');
  }
  if (habit.userId !== userId) {
    throw forbidden();
  }

  const config = JSON.parse(habit.frequencyConfig) as FrequencyConfig;
  const today = todayString();
  const start = startOfYear(today);
  const end = endOfYear(today);
  const habitStart = toDateString(habit.startDate);
  const effectiveStart = start < habitStart ? habitStart : start;

  const completedSet = new Set(
    habit.checkIns.filter((c) => c.completed).map((c) => toDateString(c.date)),
  );

  return buildHeatmap(effectiveStart, end, config, completedSet);
}

export type { Prisma };
