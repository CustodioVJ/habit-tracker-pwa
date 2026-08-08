import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Flame, Archive, Trash2, Pencil } from 'lucide-react';
import { HabitWithMeta, Category, FrequencyConfig } from '@habit/shared';
import { habitApi, categoryApi } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';
import { HabitFormModal } from '../components/HabitFormModal';

export function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithMeta[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HabitWithMeta | null>(null);

  const load = useCallback(async () => {
    try {
      const [h, c] = await Promise.all([
        habitApi.list({ includeArchived: showArchived }),
        categoryApi.list(),
      ]);
      setHabits(h.habits);
      setCategories(c.categories);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleArchive = async (habit: HabitWithMeta) => {
    await habitApi.archive(habit.id);
    await load();
  };

  const handleDelete = async (habit: HabitWithMeta) => {
    if (!window.confirm(`Delete "${habit.name}"? This cannot be undone.`)) return;
    await habitApi.remove(habit.id);
    await load();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {habits.length} habit{habits.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          <Plus size={18} />
          New habit
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`btn-secondary ${!showArchived ? 'ring-2 ring-brand-500' : ''}`}
        >
          Active
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`btn-secondary ${showArchived ? 'ring-2 ring-brand-500' : ''}`}
        >
          Archived
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {showArchived ? 'No archived habits.' : 'No habits yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <div key={habit.id} className="card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <Link
                    to={`/habits/${habit.id}`}
                    className="font-semibold text-gray-900 hover:text-brand-600 dark:text-white"
                  >
                    {habit.name}
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(habit); setModalOpen(true); }}
                    className="rounded p-1 text-gray-400 hover:text-brand-500"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  {!habit.isArchived && (
                    <button
                      onClick={() => void handleArchive(habit)}
                      className="rounded p-1 text-gray-400 hover:text-amber-500"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => void handleDelete(habit)}
                    className="rounded p-1 text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                  {habit.category?.name ?? 'Uncategorized'}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                  {frequencyLabel(habit.frequencyType, habit.frequencyConfig)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 font-semibold text-orange-500">
                  <Flame size={16} />
                  {habit.streak.current} day streak
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Best: {habit.streak.longest}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <HabitFormModal
          categories={categories}
          habit={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); void load(); }}
        />
      )}
    </div>
  );
}

function frequencyLabel(type: string, config: FrequencyConfig): string {
  switch (type) {
    case 'daily':
      return 'Daily';
    case 'specific_days':
      return 'Specific days';
    case 'weekly':
      return `${(config as { timesPerWeek?: number }).timesPerWeek ?? 1}x / week`;
    default:
      return type;
  }
}
