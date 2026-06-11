'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ManagerSidebar } from '@/components/layout/ManagerSidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AppShell } from '@/components/layout/AppShell';
import { PageSpinner } from '@/components/ui/Spinner';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/manager/login';

  useEffect(() => {
    if (isLogin || isLoading) return;
    if (!isAuthenticated) { router.replace('/manager/login'); return; }
    if (role !== 'MANAGER' && role !== 'ADMIN') { router.replace('/manager/login'); }
  }, [isAuthenticated, isLoading, role, router, isLogin]);

  if (isLogin) return <>{children}</>;
  if (isLoading || !isAuthenticated || (role !== 'MANAGER' && role !== 'ADMIN')) return <PageSpinner />;

  return (
    <AppShell sidebar={(onClose) => role === 'ADMIN' ? <AdminSidebar onClose={onClose} /> : <ManagerSidebar onClose={onClose} />}>
      {children}
    </AppShell>
  );
}
