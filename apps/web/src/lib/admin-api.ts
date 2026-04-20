const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function adminFetch<T>(
  path: string,
  init?: Omit<RequestInit, 'json'> & { json?: unknown },
): Promise<T> {
  const { json, ...fetchInit } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...fetchInit,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchInit.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Period = '7d' | '30d' | '90d';

export interface MetricsOverview {
  totalRevenueCents: number;
  orderCount: number;
  avgCartCents: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    _sum: { quantity: number; totalCents: number };
  }>;
  lowStock: Array<{ id: string; name: string; stock: number; stockStatus: string }>;
}

export interface TimeseriesPoint {
  date: string;
  value: number;
}

export const adminApi = {
  metrics: {
    overview: (period: Period = '30d') =>
      adminFetch<MetricsOverview>(`/admin/metrics/overview?period=${period}`),
    timeseries: (metric = 'revenue', period: Period = '30d') =>
      adminFetch<TimeseriesPoint[]>(`/admin/metrics/timeseries?metric=${metric}&period=${period}`),
    lowStock: () => adminFetch<unknown[]>('/admin/metrics/low-stock'),
  },

  products: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: unknown[]; total: number; page: number; pages: number }>(
        `/admin/products${qs}`,
      );
    },
    create: (json: unknown) => adminFetch('/admin/products', { method: 'POST', json }),
    update: (id: string, json: unknown) =>
      adminFetch(`/admin/products/${id}`, { method: 'PATCH', json }),
    delete: (id: string) => adminFetch(`/admin/products/${id}`, { method: 'DELETE' }),
    addImage: (id: string, json: unknown) =>
      adminFetch(`/admin/products/${id}/images`, { method: 'POST', json }),
    reorderImages: (id: string, ids: string[]) =>
      adminFetch(`/admin/products/${id}/images/reorder`, { method: 'PATCH', json: { ids } }),
    deleteImage: (id: string, imageId: string) =>
      adminFetch(`/admin/products/${id}/images/${imageId}`, { method: 'DELETE' }),
    adjustStock: (id: string, json: unknown) =>
      adminFetch(`/admin/products/${id}/stock`, { method: 'POST', json }),
    signUpload: (folder: string) =>
      adminFetch('/admin/uploads/sign', { method: 'POST', json: { folder } }),
  },

  orders: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: unknown[]; total: number; page: number; pages: number }>(
        `/admin/orders${qs}`,
      );
    },
    get: (id: string) => adminFetch(`/admin/orders/${id}`),
    updateStatus: (id: string, json: unknown) =>
      adminFetch(`/admin/orders/${id}/status`, { method: 'PATCH', json }),
    refund: (id: string, json: unknown) =>
      adminFetch(`/admin/orders/${id}/refund`, { method: 'POST', json }),
  },

  users: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: unknown[]; total: number; page: number; pages: number }>(
        `/admin/users${qs}`,
      );
    },
    get: (id: string) => adminFetch(`/admin/users/${id}`),
    update: (id: string, json: unknown) =>
      adminFetch(`/admin/users/${id}`, { method: 'PATCH', json }),
  },

  reviews: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: unknown[]; total: number; page: number; pages: number }>(
        `/admin/reviews${qs}`,
      );
    },
    approve: (id: string) => adminFetch(`/admin/reviews/${id}/approve`, { method: 'PATCH' }),
    delete: (id: string) => adminFetch(`/admin/reviews/${id}`, { method: 'DELETE' }),
  },

  auditLog: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: unknown[]; total: number; page: number; pages: number }>(
        `/admin/audit-log${qs}`,
      );
    },
  },
};
