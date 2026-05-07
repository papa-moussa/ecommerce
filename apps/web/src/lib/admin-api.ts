import type { PromoCode } from '@ecommerce/shared-types';

import { authenticatedFetch } from './api';

async function adminFetch<T>(
  path: string,
  init?: Omit<RequestInit, 'json'> & { json?: unknown },
): Promise<T> {
  const { json, ...fetchInit } = init ?? {};
  return authenticatedFetch<T>(path, {
    ...fetchInit,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });
}

export type Period = '7d' | '30d' | '90d';

export interface Category {
  id: string;
  name: string;
}

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
  },

  uploads: {
    sign: (folder: string) =>
      adminFetch<{
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
        folder: string;
      }>('/admin/uploads/sign', { method: 'POST', json: { folder } }),
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

  emails: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: unknown[]; total: number; page: number; pages: number }>(
        `/admin/email-logs${qs}`,
      );
    },
  },

  promoCodes: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : '';
      return adminFetch<{ items: PromoCode[]; total: number; page: number; pages: number }>(
        `/admin/promo-codes${qs}`,
      );
    },
    get: (id: string) => adminFetch<PromoCode>(`/admin/promo-codes/${id}`),
    create: (json: unknown) => adminFetch('/admin/promo-codes', { method: 'POST', json }),
    update: (id: string, json: unknown) =>
      adminFetch(`/admin/promo-codes/${id}`, { method: 'PATCH', json }),
    delete: (id: string) => adminFetch(`/admin/promo-codes/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => adminFetch<Category[]>('/categories'),
    create: (json: unknown) => adminFetch('/admin/categories', { method: 'POST', json }),
    update: (id: string, json: unknown) =>
      adminFetch(`/admin/categories/${id}`, { method: 'PUT', json }),
    delete: (id: string) => adminFetch(`/admin/categories/${id}`, { method: 'DELETE' }),
  },
};
