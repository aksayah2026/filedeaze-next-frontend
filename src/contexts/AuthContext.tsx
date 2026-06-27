'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import { setAccessToken } from '@/lib/axios';
import { getPortalPrefix, setCookie, getCookie, eraseCookie } from '@/lib/auth-helper';

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
  const pathname = usePathname();
  const prefix = getPortalPrefix(pathname);

  useEffect(() => {
    setIsLoading(true);
    const stored = localStorage.getItem(`${prefix}_user`);
    const rt = localStorage.getItem(`${prefix}_refreshToken`);
    if (stored && rt) {
      try {
        setUser(JSON.parse(stored));
        // Restore access token from sessionStorage/cookie so API calls work after a hard reload
        const at = sessionStorage.getItem(`${prefix}_accessToken`) || getCookie(`${prefix}_accessToken`);
        if (at) {
          setAccessToken(at);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
        localStorage.removeItem(`${prefix}_user`);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [prefix]);

  const setAuth = useCallback((u: User, at: string, rt: string) => {
    const currentPrefix = getPortalPrefix();
    setUser(u);
    setAccessToken(at);
    
    sessionStorage.setItem(`${currentPrefix}_accessToken`, at);
    localStorage.setItem(`${currentPrefix}_refreshToken`, rt);
    localStorage.setItem(`${currentPrefix}_user`, JSON.stringify(u));
    
    setCookie(`${currentPrefix}_accessToken`, at, 1);
    setCookie(`${currentPrefix}_refreshToken`, rt, 7);
  }, []);

  const clearAuth = useCallback(() => {
    const currentPrefix = getPortalPrefix();
    setUser(null);
    setAccessToken(null);
    
    sessionStorage.removeItem(`${currentPrefix}_accessToken`);
    localStorage.removeItem(`${currentPrefix}_refreshToken`);
    localStorage.removeItem(`${currentPrefix}_user`);
    
    eraseCookie(`${currentPrefix}_accessToken`);
    eraseCookie(`${currentPrefix}_refreshToken`);
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
