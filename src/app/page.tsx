// UI REDESIGN — logic unchanged
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const { role, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/admin/login'); return; }
    if (role === 'SUPER_ADMIN') router.replace('/super-admin/dashboard');
    else if (role === 'ADMIN') router.replace('/admin/dashboard');
    else router.replace('/manager/dashboard');
  }, [isAuthenticated, role, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-50">

      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Replace with your actual <Logo /> component or <Image> */}
          <span className="text-xl font-semibold tracking-tight text-gray-900">F</span>
        </div>
        <p className="text-[15px] font-medium tracking-tight text-gray-900">FieldEaze</p>
      </div>

      {/* Spinner */}
      <div
        className="h-[30px] w-[30px] animate-spin rounded-full border-[2px] border-gray-200 border-t-gray-900"
        aria-label="Loading"
      />

      {/* Label */}
      <p className="text-[13px] text-gray-400 tracking-wide animate-in fade-in duration-500 delay-150">
        Loading your workspace…
      </p>

    </div>
  );
}