import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, CalendarDays, CheckCircle2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { HabitWithMeta, HabitStats, HeatmapCell } from '@habit/shared';
import { habitApi } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';

type Period = 'week' | 'month' | 'year';

const DONUT_COLORS = {
  completed: '#22c55e', // green
  missed: '#ef4444', // red
};

/** Rolling-average window used to smooth the daily line chart per period. */
const ROLLING_WINDOW: Record<Period, number> = {
  week: 3,
  month: 7,
  year: 30,
};

/** Number of days in a calendar year (leap-aware). */
function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/**
 * Build the donut from the calendar year, not just from recorded days.
 * Every day of the year counts: completed days are green, and every other
 * calendar day (including days without any record) is red. This way a user
 * who started today sees one thin green slice over an almost all-red donut.
 */
function donutData(heatmap: HeatmapCell[]) {
  let completed = 0;
  for (const cell of heatmap) {
    if (cell.completed) completed += 1;
  }
  const year =
    heatmap.length > 0 ? Number(heatmap[0].date.slice(0, 4)) : new Date().getFullYear();
  const missed = Math.max(0, daysInYear(year) - completed);
  return [
    { name: 'Completed', value: completed, color: DONUT_COLORS.completed },
    { name: 'Not completed', value: missed, color: DONUT_COLORS.missed },
  ];
}

/** Build a rolling-average completion series from the heatmap. */
function lineData(heatmap: HeatmapCell[], window: number) {
  const values: number[] = heatmap.map((cell) => (cell.completed ? 1 : 0));
  return heatmap.map((cell, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return {
      date: cell.date.slice(5), // MM-DD
      rate: Math.round(avg * 100),
    };
  });
}

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

  const donut = stats ? donutData(stats.heatmap) : [];
  const line = stats ? lineData(stats.heatmap, ROLLING_WINDOW[period]) : [];

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

          {stats && stats.heatmap.length > 0 && (
            <>
              {/* Donut chart — completed vs not-completed days (year) */}
              {period === 'year' && (
                <div className="card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Year overview
                  </h3>
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="h-64 w-full sm:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donut}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {donut.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 text-sm sm:w-1/2">
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: DONUT_COLORS.completed }}
                          />
                          Days completed
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {donut[0]?.value ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: DONUT_COLORS.missed }}
                          />
                          Days not completed
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {donut[1]?.value ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line chart — daily completion pattern */}
              <div className="card p-6">
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  Completion trend
                </h3>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Rolling average completion rate (%) over the selected period
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={line} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Completion']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
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
