'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AppShell } from '@/components/layout/AppShell';
import { PageSpinner } from '@/components/ui/Spinner';

// Public routes inside /admin — no auth required
const isPublicAdminPath = (path: string) =>
  path === '/admin' ||
  path === '/admin/login' ||
  /^\/admin\/[^/]+\/login$/.test(path);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicAdminPath(pathname);

  useEffect(() => {
    if (isPublic || isLoading) return;
    if (!isAuthenticated) { router.replace('/admin'); return; }
    if (role !== 'ADMIN') { router.replace('/admin'); }
  }, [isAuthenticated, isLoading, role, router, isPublic]);

  if (isPublic) return <>{children}</>;
  if (isLoading || !isAuthenticated || role !== 'ADMIN') return <PageSpinner />;

  return (
    <AppShell sidebar={(onClose) => <AdminSidebar onClose={onClose} />}>
      {children}
    </AppShell>
  );
}
