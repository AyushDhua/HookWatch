import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest, type ApiError } from '../lib/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.issues && apiErr.issues.length > 0) {
        setError(apiErr.issues.map((i) => i.message).join(', '));
      } else {
        setError(apiErr.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Start debugging your webhooks with HookWatch
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-600 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Already have an account? </span>
          <Link to="/login" className="font-medium text-zinc-950 hover:underline dark:text-zinc-50">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
