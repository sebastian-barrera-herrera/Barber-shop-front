'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as apiLogin, logout as apiLogout, onSessionChange, refreshSession } from './client';
import type { SessionUser } from './types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: SessionUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /** Dueño o administrador: puede crear y mover citas. */
  canManage: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const off = onSessionChange((u) => {
      setUser(u);
      setStatus(u ? 'authenticated' : 'anonymous');
    });
    void refreshSession();
    return () => {
      off();
    };
  }, []);

  const login = useCallback((email: string, password: string) => apiLogin(email, password), []);
  const logout = useCallback(() => apiLogout(), []);

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
      canManage: user?.role === 'OWNER' || user?.role === 'ADMIN',
    }),
    [user, status, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
