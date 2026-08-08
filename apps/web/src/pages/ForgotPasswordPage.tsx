import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { authApi, ApiError } from '../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(
        res.resetToken
          ? `Reset token (dev): ${res.resetToken}`
          : 'If an account exists with that email, a reset link has been sent.',
      );
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive a reset link
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
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Remembered your password?{' '}
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
