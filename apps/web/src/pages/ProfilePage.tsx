import { useAuth } from '../context/AuthContext';
import { CalendarDays, Clock, Mail, User as UserIcon } from 'lucide-react';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your account details</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
            {user.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <UserIcon size={18} />
            <span className="text-sm font-medium">Username</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</p>
        </div>

        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Mail size={18} />
            <span className="text-sm font-medium">Email</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.email}</p>
        </div>

        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Clock size={18} />
            <span className="text-sm font-medium">Last login</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDateTime(user.lastLoginAt)}
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <CalendarDays size={18} />
            <span className="text-sm font-medium">Account created</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
