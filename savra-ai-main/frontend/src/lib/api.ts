const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token management
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const setTokens = (token: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
};

// Mock auth (for visualization without backend) – frontend only
const MOCK_AUTH_KEY = 'mockAuth';
const MOCK_USER_KEY = 'mockUser';

export const setMockAuth = (user: { id: string; email: string; name: string; role: string; avatarUrl?: string | null; onboardingCompleted?: boolean; createdAt?: string; updatedAt?: string }) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_AUTH_KEY, 'true');
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  }
};

export const getMockAuth = (): { id: string; email: string; name: string; role: string; avatarUrl?: string | null; onboardingCompleted?: boolean; createdAt?: string; updatedAt?: string } | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MOCK_AUTH_KEY);
  const userJson = localStorage.getItem(MOCK_USER_KEY);
  if (raw !== 'true' || !userJson) return null;
  try {
    return JSON.parse(userJson) as { id: string; email: string; name: string; role: string; avatarUrl?: string | null; onboardingCompleted?: boolean; createdAt?: string; updatedAt?: string };
  } catch {
    return null;
  }
};

export const clearMockAuth = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MOCK_AUTH_KEY);
    localStorage.removeItem(MOCK_USER_KEY);
  }
};

// API error class
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// API fetch wrapper
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    const msg =
      err instanceof TypeError && (err.message === 'Failed to fetch' || err.message?.includes('fetch'))
        ? `Cannot connect to the server. Make sure the backend is running at ${API_URL.replace(/\/api\/?$/, '')}.`
        : err instanceof Error
          ? err.message
          : 'Network error';
    throw new ApiError(msg, 0);
  }

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError('Request failed', response.status);
    }
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Request failed',
      response.status,
      data.errors
    );
  }

  return data;
}

// File upload wrapper (for multipart/form-data)
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Upload failed',
      response.status,
      data.errors
    );
  }

  return data;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, data?: unknown) =>
    apiFetch<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    }),

  upload: <T>(endpoint: string, formData: FormData) =>
    apiUpload<T>(endpoint, formData, 'POST'),

  putUpload: <T>(endpoint: string, formData: FormData) =>
    apiUpload<T>(endpoint, formData, 'PUT'),
};

export default api;
