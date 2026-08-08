import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, CalendarDays, CheckCircle2 } from 'lucide-react';
import { HabitWithMeta, HabitStats } from '@habit/shared';
import { habitApi } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';

type Period = 'week' | 'month' | 'year';

export function StatsPage() {
  const [habits, setHabits] = useState<HabitWithMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    try {
      const res = await habitApi.list();
      setHabits(res.habits);
      if (res.habits.length > 0) setSelectedId(res.habits[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    habitApi
      .stats(selectedId, period)
      .then((res) => {
        if (active) setStats(res.stats);
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [selectedId, period]);

  if (loading) return <LoadingScreen />;

  const selected = habits.find((h) => h.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track your progress over time
        </p>
      </div>

      {habits.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">No habits to analyze yet.</p>
          <Link to="/habits" className="btn-primary mt-4">
            Create a habit
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <select
              className="input max-w-xs"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`btn-secondary ${period === p ? 'ring-2 ring-brand-500' : ''}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: selected.color }}
                />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selected.name}
                </h2>
              </div>

              {stats ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatBox
                    icon={<Flame className="text-orange-500" size={20} />}
                    label="Current streak"
                    value={`${stats.currentStreak} days`}
                  />
                  <StatBox
                    icon={<TrendingUp className="text-brand-500" size={20} />}
                    label="Longest streak"
                    value={`${stats.longestStreak} days`}
                  />
                  <StatBox
                    icon={<CheckCircle2 className="text-green-500" size={20} />}
                    label="Completions"
                    value={`${stats.totalCompletions}`}
                  />
                  <StatBox
                    icon={<CalendarDays className="text-purple-500" size={20} />}
                    label="Completion rate"
                    value={`${stats.completionRate}%`}
                  />
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No data for this period.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
      <div className="mb-2 text-gray-500 dark:text-gray-400">{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
