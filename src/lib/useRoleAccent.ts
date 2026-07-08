/**
 * useRoleAccent
 * Returns the primary hex color that matches the current role/portal theme.
 * Mirrors the same color map used in ClientThemeProvider so KPI cards
 * always reflect the login theme accent automatically.
 */
'use client';

import { usePathname } from 'next/navigation';

const ROLE_ACCENT: Record<string, string> = {
  'super-admin': '#2563EB', // Blue   — Super Admin
  'admin':       '#14B8A6', // Teal   — Admin
  'manager':     '#22C55E', // Green  — Manager
};

export function useRoleAccent(): string {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/super-admin')) return ROLE_ACCENT['super-admin'];
  if (pathname.startsWith('/admin'))       return ROLE_ACCENT['admin'];
  if (pathname.startsWith('/manager'))     return ROLE_ACCENT['manager'];

  return ROLE_ACCENT['super-admin']; // safe fallback
}
