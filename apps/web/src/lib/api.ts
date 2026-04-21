import type {
  Paginated,
  ProductCard as ProductCardType,
  ProductDetail,
  User,
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
      return serverFetch<Paginated<ProductCardType>>(`/products${qs}`, { cache: 'no-store' });
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

async function clientFetch<T>(
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
    if (ok) return clientFetch<T>(path, { ...init, _isRetry: true });
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
}

export interface CreateOrderResult {
  orderId: string;
  clientSecret: string;
}

export const clientApi = {
  wishlist: {
    list: () => clientFetch<ProductCardType[]>('/wishlist'),
    add: (productId: string) =>
      clientFetch<{ productId: string; wishlisted: boolean }>(`/wishlist/${productId}`, {
        method: 'POST',
      }),
    remove: (productId: string) =>
      clientFetch<void>(`/wishlist/${productId}`, { method: 'DELETE' }),
  },
  cart: {
    sync: (items: CartItemInput[]) =>
      clientFetch<void>('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    validate: (items: CartItemInput[]) =>
      clientFetch<ValidatedCart>('/cart/validate', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
  },
  orders: {
    create: (data: CreateOrderData) =>
      clientFetch<CreateOrderResult>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => clientFetch<unknown[]>('/orders'),
    get: (orderId: string) => clientFetch<unknown>(`/orders/${orderId}`),
  },
  auth: {
    login: (data: LoginData) =>
      clientFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterData) =>
      clientFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => clientFetch<User>('/auth/me'),
    logout: () => clientFetch<void>('/auth/logout', { method: 'POST' }),
    refresh: tryRefresh,
    verifyEmail: (token: string) =>
      clientFetch<{ message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    resendVerification: () =>
      clientFetch<{ message: string }>('/auth/resend-verification', { method: 'POST' }),
    forgotPassword: (email: string) =>
      clientFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      clientFetch<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },
};
