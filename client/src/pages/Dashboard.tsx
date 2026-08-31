import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export interface Endpoint {
  id: string;
  userId: string;
  name: string;
  publicToken: string;
  isActive: boolean;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEndpointName, setNewEndpointName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch endpoints
  const { data, isLoading, error } = useQuery({
    queryKey: ['endpoints'],
    queryFn: () => apiRequest<{ endpoints: Endpoint[] }>('/api/endpoints'),
  });

  const endpoints = data?.endpoints || [];

  // Create endpoint mutation
  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest<{ endpoint: Endpoint }>('/api/endpoints', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      setIsCreating(false);
      setNewEndpointName('');
      setCreateError(null);
    },
    onError: (err: any) => {
      setCreateError(err.error || 'Failed to create endpoint.');
    },
  });

  // Delete endpoint mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/endpoints/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      setDeletingId(null);
    },
    onError: (err: any) => {
      alert(err.error || 'Failed to delete endpoint.');
    },
  });

  const getWebhookUrl = (publicToken: string) => {
    const base = import.meta.env.VITE_WEBHOOK_BASE_URL || window.location.origin;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/h/${publicToken}`;
  };

  const handleCopy = async (token: string, endpointId: string) => {
    try {
      await navigator.clipboard.writeText(getWebhookUrl(token));
      setCopiedId(endpointId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newEndpointName.trim()) {
      setCreateError('Name is required');
      return;
    }
    createMutation.mutate(newEndpointName.trim());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-zinc-100" />
          <span className="text-lg font-semibold tracking-tight">HookWatch</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden text-right text-xs sm:block">
            <p className="font-medium text-zinc-950 dark:text-zinc-50">{user?.name}</p>
            <p className="text-zinc-500 dark:text-zinc-400">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Webhook Endpoints
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create and manage public URLs to inspect incoming webhook requests.
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-855 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create Endpoint
            </button>
          )}
        </div>

        {/* Workflow Instructions Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-950 dark:text-zinc-50">1</div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Create Endpoint</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Generate a unique, safe public URL dedicated to capturing webhooks.</p>
          </div>
          <div className="space-y-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-950 dark:text-zinc-50">2</div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Send Webhook Request</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Give the URL to Stripe/GitHub, or trigger it via Postman/cURL.</p>
          </div>
          <div className="space-y-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-950 dark:text-zinc-50">3</div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Inspect payloads</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Inspect HTTP headers, queries, response status, and JSON bodies in real time.</p>
          </div>
        </div>

        {/* Endpoint Creation Form Card */}
        {isCreating && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 max-w-xl">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Create new endpoint
            </h3>
            {createError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-650 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="endpoint-name" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Endpoint Name
                </label>
                <input
                  id="endpoint-name"
                  type="text"
                  required
                  value={newEndpointName}
                  onChange={(e) => setNewEndpointName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500 sm:text-sm"
                  placeholder="e.g. stripe-webhooks"
                />
              </div>
              <div className="flex justify-end space-x-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setCreateError(null);
                    setNewEndpointName('');
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-750 hover:bg-zinc-50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-zinc-900 px-3 py-2 font-medium text-white shadow hover:bg-zinc-800 focus:outline-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Query State Displays */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Fetching webhooks...
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            Failed to load endpoints. Please refresh to try again.
          </div>
        )}

        {!isLoading && !error && endpoints.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 border-dashed bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">No webhooks created yet</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Get started by creating your first webhook endpoint.</p>
          </div>
        )}

        {/* Endpoints List */}
        {!isLoading && !error && endpoints.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition"
              >
                {/* Deletion Confirmation Overlay */}
                {deletingId === endpoint.id && (
                  <div className="absolute inset-0 z-10 flex flex-col justify-between rounded-xl bg-white/95 p-6 dark:bg-zinc-900/95">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-red-650 dark:text-red-400">Delete endpoint?</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        This action cannot be undone. All captured webhook history will be permanently deleted.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2 text-xs">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 font-medium text-zinc-750 hover:bg-zinc-50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(endpoint.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg bg-red-600 px-2.5 py-1.5 font-medium text-white shadow hover:bg-red-500 focus:outline-none disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {endpoint.name}
                    </h3>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-455">
                      Active
                    </span>
                  </div>

                  {/* Endpoint Details */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={getWebhookUrl(endpoint.publicToken)}
                        className="flex-1 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-450"
                      />
                      <button
                        onClick={() => handleCopy(endpoint.publicToken, endpoint.id)}
                        className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-750 text-xs font-medium min-w-[55px]"
                      >
                        {copiedId === endpoint.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      Created on {formatDate(endpoint.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                  <button
                    onClick={() => navigate(`/endpoints/${endpoint.id}/events`)}
                    className="text-xs font-semibold text-zinc-950 hover:underline dark:text-zinc-50"
                  >
                    View History →
                  </button>
                  <button
                    onClick={() => setDeletingId(endpoint.id)}
                    className="text-xs text-red-655 hover:text-red-500 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default Dashboard;
