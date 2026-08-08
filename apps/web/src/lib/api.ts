import {
  User,
  HabitWithMeta,
  Category,
  DashboardData,
  HabitStats,
  HeatmapCell,
  CheckIn,
} from '@habit/shared';

const BASE_URL = '/api/v1';

/** Access token stored in memory (not localStorage) for security. */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** API error with a normalized shape. */
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = 'Request failed';
    let code = 'UNKNOWN';
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
      code = data?.error?.code ?? code;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// ---- Auth ----
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  login: (data: { email: string; password: string }) =>
    request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  me: () => request<{ user: User }>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST', auth: false }),
  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      auth: false,
    }),
};

// ---- Dashboard ----
export const dashboardApi = {
  get: () => request<DashboardData>('/dashboard'),
};

// ---- Habits ----
export const habitApi = {
  list: (params?: { includeArchived?: boolean; categoryId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.includeArchived) qs.set('includeArchived', 'true');
    if (params?.categoryId) qs.set('categoryId', params.categoryId);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ habits: HabitWithMeta[] }>(`/habits${suffix}`);
  },
  get: (id: string) => request<{ habit: HabitWithMeta }>(`/habits/${id}`),
  create: (data: unknown) =>
    request<{ habit: HabitWithMeta }>('/habits', { method: 'POST', body: data }),
  update: (id: string, data: unknown) =>
    request<{ habit: HabitWithMeta }>(`/habits/${id}`, { method: 'PATCH', body: data }),
  archive: (id: string) =>
    request<{ habit: HabitWithMeta }>(`/habits/${id}/archive`, { method: 'POST' }),
  unarchive: (id: string) =>
    request<{ habit: HabitWithMeta }>(`/habits/${id}/unarchive`, { method: 'POST' }),
  remove: (id: string) => request<void>(`/habits/${id}`, { method: 'DELETE' }),
  checkIn: (habitId: string, data: { date: string; completed: boolean; note?: string }) =>
    request<{ checkIn: CheckIn }>(`/habits/${habitId}/check-ins`, {
      method: 'PUT',
      body: data,
    }),
  stats: (habitId: string, period: 'week' | 'month' | 'year') =>
    request<{ stats: HabitStats }>(`/habits/${habitId}/stats?period=${period}`),
  heatmap: (habitId: string) =>
    request<{ heatmap: HeatmapCell[] }>(`/habits/${habitId}/heatmap`),
};

// ---- Categories ----
export const categoryApi = {
  list: () => request<{ categories: Category[] }>('/categories'),
  create: (data: { name: string; color: string }) =>
    request<{ category: Category }>('/categories', { method: 'POST', body: data }),
  update: (id: string, data: { name?: string; color?: string }) =>
    request<{ category: Category }>(`/categories/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};
