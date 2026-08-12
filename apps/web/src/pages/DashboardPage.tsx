import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, CheckCircle2, Circle, TrendingUp, CalendarDays } from 'lucide-react';
import { DashboardData, HabitWithMeta } from '@habit/shared';
import { dashboardApi, habitApi } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await dashboardApi.get();
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleCheckIn = async (habit: HabitWithMeta) => {
    const today = todayString();
    const next = !habit.todayCompleted;
    try {
      await habitApi.checkIn(habit.id, { date: today, completed: next });
      await load();
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const { habits, stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Flame className="text-orange-500" size={20} />}
          label="Current streak"
          value={`${stats.totalCurrentStreak} days`}
        />
        <StatCard
          icon={<TrendingUp className="text-brand-500" size={20} />}
          label="Best streak"
          value={`${stats.totalLongestStreak} days`}
        />
        <StatCard
          icon={<CheckCircle2 className="text-green-500" size={20} />}
          label="Completed today"
          value={`${stats.completedToday}/${stats.totalHabits}`}
        />
        <StatCard
          icon={<CalendarDays className="text-purple-500" size={20} />}
          label="Active days this week"
          value={`${stats.completedThisWeek} days`}
        />
      </div>

      {/* Today's habits */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today</h2>
          <Link to="/habits" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Manage habits
          </Link>
        </div>
        {habits.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No habits yet.</p>
            <Link to="/habits" className="btn-primary mt-4">
              Create your first habit
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {habits.map((habit) => (
              <li key={habit.id} className="flex items-center gap-4 py-3">
                <button
                  onClick={() => void toggleCheckIn(habit)}
                  className="shrink-0"
                  title={habit.todayCompleted ? 'Mark as not done' : 'Mark as done'}
                >
                  {habit.todayCompleted ? (
                    <CheckCircle2 size={28} className="text-green-500" />
                  ) : (
                    <Circle size={28} className="text-gray-300 hover:text-brand-500 dark:text-gray-600" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/habits/${habit.id}`}
                    className="block truncate font-medium text-gray-900 hover:text-brand-600 dark:text-white"
                  >
                    {habit.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    {habit.category?.name ?? 'Uncategorized'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                  <Flame size={16} />
                  {habit.streak.current}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
