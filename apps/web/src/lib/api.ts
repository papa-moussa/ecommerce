import type {
  Paginated,
  ProductCard as ProductCardType,
  ProductDetail,
  User,
  ApplyPromoResponse,
} from '@ecommerce/shared-types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ---------------------------------------------------------------------------
// Server-side helpers (RSC — stateless, no auth)
// ---------------------------------------------------------------------------

async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const serverApi = {
  products: {
    list: (params?: Record<string, string>) => {
      const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
      return serverFetch<Paginated<ProductCardType>>(`/products${qs}`, {
        next: { revalidate: 3600 },
      });
    },
    bySlug: (slug: string) =>
      serverFetch<ProductDetail>(`/products/${slug}`, { next: { revalidate: 3600 } }),
    related: (id: string) =>
      serverFetch<ProductCardType[]>(`/products/${id}/related`, { next: { revalidate: 3600 } }),
    featured: () =>
      serverFetch<ProductCardType[]>('/products/featured', { next: { revalidate: 900 } }),
    bestsellers: () =>
      serverFetch<ProductCardType[]>('/products/bestsellers', { next: { revalidate: 3600 } }),
  },
  reviews: {
    listByProduct: (productId: string, page = 1) =>
      serverFetch<unknown>(`/products/${productId}/reviews?page=${page}`, {
        next: { revalidate: 300 },
      }),
  },
};

// ---------------------------------------------------------------------------
// Client-side API (browser — access token in memory + auto-refresh)
// ---------------------------------------------------------------------------

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export class AuthError extends Error {
  constructor() {
    super('Session expirée. Veuillez vous reconnecter.');
    this.name = 'AuthError';
  }
}

export async function authenticatedFetch<T>(
  path: string,
  init: RequestInit & { _isRetry?: boolean } = {},
): Promise<T> {
  const { _isRetry, ...fetchInit } = init;

  const res = await fetch(`${BASE}${path}`, {
    ...fetchInit,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
      ...(fetchInit.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401 && !_isRetry) {
    const ok = await tryRefresh();
    if (ok) return authenticatedFetch<T>(path, { ...init, _isRetry: true });
    _accessToken = null;
    throw new AuthError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    _accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Auth2FAResponse {
  requires2FA: true;
  tempToken: string;
  role: string;
}

export type LoginResponse = AuthResponse | Auth2FAResponse;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface ValidatedCart {
  items: {
    productId: string;
    variantId?: string | null;
    name: string;
    unitPriceCents: number;
    quantity: number;
    isValid: boolean;
    reason?: string;
    stockAvailable?: number;
  }[];
  subtotalCents: number;
  isValid: boolean;
  invalidItems: string[];
}

export interface CreateOrderData {
  items: CartItemInput[];
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  giftMessage?: string;
  promoCode?: string;
  paymentMethod?: 'ONLINE' | 'CASH_ON_DELIVERY';
  email?: string;
  phone?: string;
}

export interface CreateOrderResult {
  orderId: string;
  clientSecret: string;
}

export const clientApi = {
  wishlist: {
    list: () => authenticatedFetch<ProductCardType[]>('/wishlist'),
    add: (productId: string) =>
      authenticatedFetch<{ productId: string; wishlisted: boolean }>(`/wishlist/${productId}`, {
        method: 'POST',
      }),
    remove: (productId: string) =>
      authenticatedFetch<void>(`/wishlist/${productId}`, { method: 'DELETE' }),
  },
  cart: {
    sync: (items: CartItemInput[]) =>
      authenticatedFetch<void>('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    validate: (items: CartItemInput[]) =>
      authenticatedFetch<ValidatedCart>('/cart/validate', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    applyPromo: (code: string, subtotalCents: number) =>
      authenticatedFetch<ApplyPromoResponse>('/cart/apply-promo', {
        method: 'POST',
        body: JSON.stringify({ code, subtotalCents }),
      }),
    recover: (token: string) =>
      authenticatedFetch<ValidatedCart>('/cart/recover', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },
  orders: {
    create: (data: CreateOrderData) =>
      authenticatedFetch<CreateOrderResult>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => authenticatedFetch<unknown[]>('/orders'),
    get: (orderId: string) => authenticatedFetch<unknown>(`/orders/${orderId}`),
  },
  auth: {
    login: (data: LoginData) =>
      authenticatedFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterData) =>
      authenticatedFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => authenticatedFetch<User>('/auth/me'),
    logout: () => authenticatedFetch<void>('/auth/logout', { method: 'POST' }),
    refresh: tryRefresh,
    verifyEmail: (token: string) =>
      authenticatedFetch<{ message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    resendVerification: () =>
      authenticatedFetch<{ message: string }>('/auth/resend-verification', { method: 'POST' }),
    forgotPassword: (email: string) =>
      authenticatedFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      authenticatedFetch<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
    verify2FA: (tempToken: string, code: string) =>
      authenticatedFetch<{ accessToken: string }>('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ tempToken, code }),
      }),
    unsubscribe: (email: string) =>
      authenticatedFetch<{ success: boolean }>('/users/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
  reviews: {
    listByProduct: (productId: string, page = 1) =>
      fetch(`${BASE}/products/${productId}/reviews?page=${page}`).then((res) => res.json()),
    create: (productId: string, data: { rating: number; title?: string; comment: string }) =>
      authenticatedFetch<unknown>(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
