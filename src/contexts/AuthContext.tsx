'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { setAccessToken } from '@/lib/axios';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const rt = localStorage.getItem('refreshToken');
    if (stored && rt) {
      try {
        setUser(JSON.parse(stored));
        // Restore access token from sessionStorage so API calls work after a hard reload
        const at = sessionStorage.getItem('accessToken');
        if (at) setAccessToken(at);
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const setAuth = useCallback((u: User, at: string, rt: string) => {
    setUser(u);
    setAccessToken(at);
    sessionStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, role: user?.role ?? null, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
