'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /admin/login redirects to the workspace discovery page at /admin
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}
