import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { Category, HabitWithMeta, FrequencyType } from '@habit/shared';
import { habitApi, ApiError } from '../lib/api';

const COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
];

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

interface Props {
  categories: Category[];
  habit: HabitWithMeta | null;
  onClose: () => void;
  onSaved: () => void;
}

export function HabitFormModal({ categories, habit, onClose, onSaved }: Props) {
  const [name, setName] = useState(habit?.name ?? '');
  const [color, setColor] = useState(habit?.color ?? COLORS[5]);
  const [categoryId, setCategoryId] = useState(habit?.categoryId ?? '');
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    habit?.frequencyType ?? 'daily',
  );
  const [days, setDays] = useState<number[]>(
    (habit?.frequencyConfig as { days?: number[] })?.days ?? [1, 3, 5],
  );
  const [timesPerWeek, setTimesPerWeek] = useState(
    (habit?.frequencyConfig as { timesPerWeek?: number })?.timesPerWeek ?? 3,
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (day: number) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let frequencyConfig: unknown;
    if (frequencyType === 'daily') {
      frequencyConfig = { type: 'daily' };
    } else if (frequencyType === 'specific_days') {
      frequencyConfig = { type: 'specific_days', days };
    } else {
      frequencyConfig = { type: 'weekly', timesPerWeek };
    }

    const payload = {
      name,
      color,
      categoryId: categoryId || null,
      frequencyType,
      frequencyConfig,
    };

    try {
      if (habit) {
        await habitApi.update(habit.id, payload);
      } else {
        await habitApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save habit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {habit ? 'Edit habit' : 'New habit'}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="label" htmlFor="habit-name">
              Name
            </label>
            <input
              id="habit-name"
              type="text"
              required
              className="input"
              placeholder="e.g. Morning run"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="habit-category">
              Category
            </label>
            <select
              id="habit-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'specific_days', 'weekly'] as FrequencyType[]).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFrequencyType(ft)}
                  className={`btn-secondary flex-1 ${frequencyType === ft ? 'ring-2 ring-brand-500' : ''}`}
                >
                  {ft === 'daily' ? 'Daily' : ft === 'weekly' ? 'Weekly' : 'Specific days'}
                </button>
              ))}
            </div>
          </div>

          {frequencyType === 'specific_days' && (
            <div>
              <label className="label">Days of the week</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`btn-secondary ${days.includes(value) ? 'ring-2 ring-brand-500' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequencyType === 'weekly' && (
            <div>
              <label className="label" htmlFor="times-per-week">
                Times per week
              </label>
              <input
                id="times-per-week"
                type="number"
                min={1}
                max={7}
                className="input"
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(Number(e.target.value))}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : habit ? 'Save changes' : 'Create habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
