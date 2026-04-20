'use client';

import type { User } from '@ecommerce/shared-types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { clientApi, type LoginData, type RegisterData, setAccessToken } from './api';

export interface LoginResult {
  requires2FA?: true;
  tempToken?: string;
  role?: string;
  totpEnabled?: boolean;
}

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const ok = await clientApi.auth.refresh();
      if (ok) {
        const u = await clientApi.auth.me().catch(() => null);
        setUser(u);
      }
    }
    init()
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (data: LoginData): Promise<LoginResult> => {
    const result = await clientApi.auth.login(data);
    if ('requires2FA' in result && result.requires2FA) {
      return {
        requires2FA: true,
        tempToken: (result as { requires2FA: true; tempToken: string }).tempToken,
      };
    }
    const ok = result as { user: User; accessToken: string };
    setAccessToken(ok.accessToken);
    setUser(ok.user);
    return { role: ok.user.role, totpEnabled: ok.user.totpEnabled };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { user: u, accessToken } = await clientApi.auth.register(data);
    setAccessToken(accessToken);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clientApi.auth.logout().catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
