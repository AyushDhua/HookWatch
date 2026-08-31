import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// A temporary Dashboard placeholder to verify auth and logout state.
// Will be fully implemented in Phase 9.
const DashboardPlaceholder: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">HookWatch</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Logged in as: <strong className="text-zinc-900 dark:text-zinc-100">{user?.name}</strong> ({user?.email})
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-medium text-zinc-950 dark:text-zinc-50">Dashboard Placeholder</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Authentication successfully configured. User session restored.
          </p>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes (redirect to /dashboard if already logged in) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected routes (redirect to /login if not logged in) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPlaceholder />
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">404</h1>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">Page not found</p>
                    <Link to="/" className="mt-4 inline-block text-sm text-zinc-950 hover:underline dark:text-zinc-50 font-medium">
                      Go home
                    </Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
