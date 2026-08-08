import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Category } from '@habit/shared';
import { categoryApi, ApiError } from '../lib/api';
import { LoadingScreen } from '../components/LoadingScreen';

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

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[5]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await categoryApi.list();
      setCategories(res.categories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await categoryApi.update(editingId, { name, color });
      } else {
        await categoryApi.create({ name, color });
      }
      setName('');
      setColor(COLORS[5]);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    await categoryApi.remove(cat.id);
    await load();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Organize your habits into categories
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label" htmlFor="cat-name">
              {editingId ? 'Edit category' : 'New category'}
            </label>
            <input
              id="cat-name"
              type="text"
              required
              className="input"
              placeholder="e.g. Health"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setColor(COLORS[5]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
            <button type="submit" disabled={submitting} className="btn-primary">
              <Plus size={18} />
              {editingId ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </form>

      {categories.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">No categories yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{cat.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cat._count?.habits ?? 0} habits
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="rounded p-1 text-gray-400 hover:text-brand-500"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => void handleDelete(cat)}
                  className="rounded p-1 text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
