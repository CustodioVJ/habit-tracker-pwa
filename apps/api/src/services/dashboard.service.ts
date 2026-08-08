import { DashboardData } from '@habit/shared';
import { listHabits } from './habit.service';
import { listCategories } from './category.service';
import { getAggregateCompletionRate } from './stats.service';
import { todayString, startOfWeek } from '../lib/dates';

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

  const stats = {
    totalHabits: habits.length,
    totalCurrentStreak: habits.reduce((sum, h) => sum + h.streak.current, 0),
    totalLongestStreak: habits.reduce((sum, h) => sum + h.streak.longest, 0),
    completedToday: habits.filter((h) => h.todayCompleted).length,
    completedThisWeek: habits.reduce((sum, h) => {
      // Count check-ins this week via the habit's streak lastCompletedDate range.
      // For simplicity, count habits whose last completion is within this week.
      const last = h.streak.lastCompletedDate;
      return sum + (last && last >= weekStart ? 1 : 0);
    }, 0),
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
