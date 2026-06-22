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

const SUBSCRIPTION_BLOCKED: string[] = ['EXPIRED', 'PAYMENT_PENDING'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicAdminPath(pathname);
  const isSubscriptionPage = pathname === '/admin/subscription';

  useEffect(() => {
    if (isPublic || isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    // Allow MANAGER on subscription page (subscription-blocked managers land here)
    const allowedRole = role === 'ADMIN' || (isSubscriptionPage && role === 'MANAGER');
    if (!allowedRole) { router.replace('/login'); return; }
    // Enforce subscription — redirect to subscription page if tenant is blocked
    if (!isSubscriptionPage && user?.tenantStatus && SUBSCRIPTION_BLOCKED.includes(user.tenantStatus)) {
      router.replace('/admin/subscription');
    }
  }, [isAuthenticated, isLoading, role, router, isPublic, isSubscriptionPage, user?.tenantStatus]);

  if (isPublic) return <>{children}</>;
  const allowedRole = role === 'ADMIN' || (isSubscriptionPage && role === 'MANAGER');
  if (isLoading || !isAuthenticated || !allowedRole) return <PageSpinner />;

  return (
    <AppShell sidebar={(onClose, isCollapsed) => <AdminSidebar onClose={onClose} isCollapsed={isCollapsed} />}>
      {children}
    </AppShell>
  );
}
