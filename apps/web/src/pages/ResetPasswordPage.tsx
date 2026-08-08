import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { authApi, ApiError } from '../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') ?? '';
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <ListChecks size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your reset token and a new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {message}
            </div>
          )}
          <div>
            <label className="label" htmlFor="token">
              Reset token
            </label>
            <input
              id="token"
              type="text"
              required
              className="input"
              placeholder="Paste your reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
