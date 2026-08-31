import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface WebhookEvent {
  id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: any;
  sourceIp: string;
  statusCode: number;
  receivedAt: string;
}

export interface Endpoint {
  id: string;
  userId: string;
  name: string;
  publicToken: string;
  isActive: boolean;
  createdAt: string;
}

export const EventHistory: React.FC = () => {
  const { id: endpointId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const limit = 20;

  // Fetch Endpoint Details (to get name, token)
  const { data: endpointData, isLoading: isLoadingEndpoint, error: endpointError } = useQuery({
    queryKey: ['endpoint', endpointId],
    queryFn: () => apiRequest<{ endpoint: Endpoint }>(`/api/endpoints/${endpointId}`),
    enabled: !!endpointId,
  });

  // Fetch Webhook Events
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (method) queryParams.set('method', method);
  if (status) queryParams.set('status', status);
  if (search) queryParams.set('search', search);

  const { data: eventsData, isLoading: isLoadingEvents, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['events', endpointId, page, method, status, search],
    queryFn: () =>
      apiRequest<{
        events: WebhookEvent[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`/api/endpoints/${endpointId}/events?${queryParams.toString()}`),
    enabled: !!endpointId,
  });

  // Fetch Selected Event Details
  const { data: selectedEventData, isLoading: isLoadingEventDetails } = useQuery({
    queryKey: ['event', selectedEventId],
    queryFn: () => apiRequest<{ event: WebhookEvent }>(`/api/events/${selectedEventId}`),
    enabled: !!selectedEventId,
  });

  const endpoint = endpointData?.endpoint;
  const events = eventsData?.events || [];
  const pagination = eventsData?.pagination;
  const selectedEvent = selectedEventData?.event;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setMethod('');
    setStatus('');
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodBadgeClass = (m: string) => {
    const base = 'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold';
    switch (m.toUpperCase()) {
      case 'GET':
        return `${base} bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400`;
      case 'POST':
        return `${base} bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400`;
      case 'PUT':
        return `${base} bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400`;
      case 'DELETE':
        return `${base} bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400`;
      default:
        return `${base} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`;
    }
  };

  const getStatusBadgeClass = (s: number) => {
    const base = 'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold';
    if (s >= 200 && s < 300) {
      return `${base} bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400`;
    }
    if (s >= 400) {
      return `${base} bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400`;
    }
    return `${base} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`;
  };

  const getWebhookUrl = (publicToken: string) => {
    const base = import.meta.env.VITE_WEBHOOK_BASE_URL || window.location.origin;
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/h/${publicToken}`;
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isLoadingEndpoint ? 'Loading endpoint...' : `${endpoint?.name || 'Endpoint'}`}
          </h1>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          User: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user?.name}</span>
        </div>
      </header>

      {/* Main Splits Panel */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Filter and Events List */}
        <div className="flex w-full md:w-1/2 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 h-full overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-zinc-150 dark:border-zinc-800/80 space-y-3 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search requests (method, IP)..."
                className="flex-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 focus:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <label className="text-zinc-500 dark:text-zinc-400">Method:</label>
                <select
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value);
                    setPage(1);
                  }}
                  className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-750 dark:bg-zinc-800"
                >
                  <option value="">All</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <label className="text-zinc-500 dark:text-zinc-400">Status:</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-750 dark:bg-zinc-800"
                >
                  <option value="">All</option>
                  <option value="200">200 OK</option>
                  <option value="400">400 Bad Request</option>
                  <option value="404">404 Not Found</option>
                </select>
              </div>

              {(method || status || search) && (
                <button
                  onClick={handleClearFilters}
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                >
                  Clear Filters
                </button>
              )}

              <button
                onClick={() => refetchEvents()}
                className="ml-auto text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium flex items-center gap-1"
                title="Refresh history"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Webhook URL instructions */}
          {endpoint && (
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-950/40 dark:border-zinc-800 text-xs flex justify-between items-center shrink-0">
              <span className="text-zinc-500 dark:text-zinc-400 truncate">
                Webhook URL: <code className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-[11px] font-mono">{getWebhookUrl(endpoint.publicToken)}</code>
              </span>
            </div>
          )}

          {/* List Loader / Error / Empty States */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingEvents && (
              <div className="flex items-center justify-center py-20 text-xs text-zinc-500 dark:text-zinc-400">
                Fetching request history...
              </div>
            )}

            {endpointError && (
              <div className="p-4 text-xs text-red-600 dark:text-red-400">
                Access Denied or Endpoint not found.
              </div>
            )}

            {eventsError && !endpointError && (
              <div className="p-4 text-xs text-red-600 dark:text-red-400">
                Failed to load webhook events.
              </div>
            )}

            {!isLoadingEvents && !eventsError && events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No requests captured</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {method || status || search ? 'Try resetting your filter parameters.' : 'Requests sent to this webhook URL will appear here.'}
                </p>
              </div>
            )}

            {/* Request List Items */}
            {!isLoadingEvents && events.length > 0 && (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`w-full text-left p-4 flex flex-col gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition ${
                      selectedEventId === event.id ? 'bg-zinc-50 dark:bg-zinc-850/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={getMethodBadgeClass(event.method)}>{event.method}</span>
                        <span className={getStatusBadgeClass(event.statusCode)}>{event.statusCode}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {formatDate(event.receivedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-mono text-[11px] truncate">IP: {event.sourceIp}</span>
                      {event.body ? (
                        <span className="text-[10px] text-zinc-400">JSON payload</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">No body</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 flex justify-between items-center text-xs shrink-0">
              <span className="text-zinc-500 dark:text-zinc-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="rounded border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Request Details Panel */}
        <div className="hidden md:flex md:w-1/2 flex-col bg-zinc-50 dark:bg-zinc-950 h-full overflow-hidden">
          {!selectedEventId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
              <svg className="h-8 w-8 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">No request selected</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Select a captured webhook request on the left list to inspect its contents.</p>
            </div>
          ) : isLoadingEventDetails ? (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
              Fetching request details...
            </div>
          ) : selectedEvent ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
              {/* Event Header */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={getMethodBadgeClass(selectedEvent.method)}>{selectedEvent.method}</span>
                    <span className={getStatusBadgeClass(selectedEvent.statusCode)}>{selectedEvent.statusCode}</span>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                    ID: {selectedEvent.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-zinc-400 dark:text-zinc-500">Received Time</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatDate(selectedEvent.receivedAt)}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 dark:text-zinc-500">Source Client IP</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedEvent.sourceIp}</span>
                  </div>
                </div>
              </div>

              {/* Event Body Inspector */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Query Parameters Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Query Parameters</h4>
                  {Object.keys(selectedEvent.queryParams).length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">None</p>
                  ) : (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950/30 overflow-hidden font-mono text-[11px]">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {Object.entries(selectedEvent.queryParams).map(([key, value]) => (
                            <tr key={key}>
                              <td className="px-4 py-2 font-semibold text-zinc-900 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-900/50 w-1/3 truncate">{key}</td>
                              <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200 truncate select-all">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* HTTP Headers Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Request Headers</h4>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950/30 overflow-hidden font-mono text-[11px]">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {Object.entries(selectedEvent.headers).map(([key, value]) => (
                          <tr key={key}>
                            <td className="px-4 py-2 font-semibold text-zinc-900 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-900/50 w-1/3 truncate">{key}</td>
                            <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200 break-all select-all">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payload/Body Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Request Body</h4>
                  {selectedEvent.body === null ? (
                    <p className="text-xs text-zinc-500 italic">No body payload received</p>
                  ) : (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950/30 p-4 font-mono text-[11px] overflow-x-auto whitespace-pre select-all text-zinc-800 dark:text-zinc-200">
                      {typeof selectedEvent.body === 'object'
                        ? JSON.stringify(selectedEvent.body, null, 2)
                        : String(selectedEvent.body)}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
              Error loading details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default EventHistory;
