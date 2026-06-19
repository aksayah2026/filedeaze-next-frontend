'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ManagerSidebar } from '@/components/layout/ManagerSidebar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AppShell } from '@/components/layout/AppShell';
import { PageSpinner } from '@/components/ui/Spinner';

const SUBSCRIPTION_BLOCKED: string[] = ['EXPIRED', 'PAYMENT_PENDING'];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/manager/login' || pathname === '/login';
  const isSubscriptionPage = pathname === '/manager/subscription' || pathname === '/admin/subscription';

  useEffect(() => {
    if (isLogin || isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (role !== 'MANAGER' && role !== 'ADMIN') { router.replace('/login'); return; }
    if (!isSubscriptionPage && user?.tenantStatus && SUBSCRIPTION_BLOCKED.includes(user.tenantStatus)) {
      router.replace('/admin/subscription');
    }
  }, [isAuthenticated, isLoading, role, router, isLogin, isSubscriptionPage, user?.tenantStatus]);

  if (isLogin) return <>{children}</>;
  if (isLoading || !isAuthenticated || (role !== 'MANAGER' && role !== 'ADMIN')) return <PageSpinner />;

  return (
    <AppShell sidebar={(onClose) => role === 'ADMIN' ? <AdminSidebar onClose={onClose} /> : <ManagerSidebar onClose={onClose} />}>
      {children}
    </AppShell>
  );
}
