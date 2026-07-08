'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TenantSettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/business-settings');
  }, [router]);

  return null;
}
