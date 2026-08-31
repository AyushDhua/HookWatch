/**
 * Simple client-side API helper.
 * Automatically attaches the Bearer JWT token from localStorage to requests.
 * Parses JSON responses and throws structured error objects for status codes >= 400.
 */

export interface ApiError {
  error: string;
  issues?: Array<{ field: string; message: string }>;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('hookwatch_token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiErr: ApiError = {
      error: data.error || 'Something went wrong',
      issues: data.issues,
    };
    throw apiErr;
  }

  return data as T;
}
