'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AppShell } from '@/components/layout/AppShell';
import { PageSpinner } from '@/components/ui/Spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (isLogin || isLoading) return;
    if (!isAuthenticated) { router.replace('/admin/login'); return; }
    if (role !== 'ADMIN') { router.replace('/admin/login'); }
  }, [isAuthenticated, isLoading, role, router, isLogin]);

  if (isLogin) return <>{children}</>;
  if (isLoading || !isAuthenticated || role !== 'ADMIN') return <PageSpinner />;

  return (
    <AppShell sidebar={(onClose) => <AdminSidebar onClose={onClose} />}>
      {children}
    </AppShell>
  );
}
