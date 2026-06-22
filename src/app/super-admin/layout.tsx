'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar';
import { AppShell } from '@/components/layout/AppShell';
import { PageSpinner } from '@/components/ui/Spinner';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/super-admin/login' || pathname === '/login';

  useEffect(() => {
    if (isLogin || isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (role !== 'SUPER_ADMIN') { router.replace('/login'); }
  }, [isAuthenticated, isLoading, role, router, isLogin]);

  if (isLogin) return <>{children}</>;
  if (isLoading || !isAuthenticated || role !== 'SUPER_ADMIN') return <PageSpinner />;

  return (
    <AppShell sidebar={(onClose, isCollapsed) => <SuperAdminSidebar onClose={onClose} isCollapsed={isCollapsed} />}>
      {children}
    </AppShell>
  );
}
