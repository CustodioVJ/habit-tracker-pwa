import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { HabitWithMeta, HeatmapCell } from '@habit/shared';
import { habitApi } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [habit, setHabit] = useState<HabitWithMeta | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [h, hm] = await Promise.all([
        habitApi.get(id),
        habitApi.heatmap(id),
      ]);
      setHabit(h.habit);
      setHeatmap(hm.heatmap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load habit');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleCheckIn = async () => {
    if (!habit) return;
    const next = !habit.todayCompleted;
    await habitApi.checkIn(habit.id, { date: todayString(), completed: next });
    await load();
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
        {error}
      </div>
    );
  }
  if (!habit) return null;

  const completedCount = heatmap.filter((c) => c.completed).length;

  return (
    <div className="space-y-6">
      <Link
        to="/habits"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-600 dark:text-gray-400"
      >
        <ArrowLeft size={16} />
        Back to habits
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: habit.color }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{habit.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {habit.category?.name ?? 'Uncategorized'}
              </p>
            </div>
          </div>
          <button onClick={() => void toggleCheckIn()} className="btn-primary">
            {habit.todayCompleted ? (
              <>
                <CheckCircle2 size={18} /> Completed today
              </>
            ) : (
              <>
                <Circle size={18} /> Mark as done
              </>
            )}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
            <p className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
              <Flame size={20} />
              {habit.streak.current}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current streak</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {habit.streak.longest}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Longest streak</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total completions</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Last 12 weeks
        </h2>
        <Heatmap heatmap={heatmap} />
      </div>
    </div>
  );
}

function Heatmap({ heatmap }: { heatmap: HeatmapCell[] }) {
  // Group by week (columns), each column has 7 days.
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.completed ? 'completed' : 'not completed'}`}
                className={`h-4 w-4 rounded-sm ${
                  cell.completed
                    ? 'bg-brand-500'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-3 rounded-sm bg-brand-500" />
        <span>More</span>
      </div>
    </div>
  );
}
