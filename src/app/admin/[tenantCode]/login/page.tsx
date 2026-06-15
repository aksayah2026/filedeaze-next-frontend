'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { flushSync } from 'react-dom';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { TenantInfo } from '@/types';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-500 to-blue-700',
    'from-violet-500 to-violet-700',
    'from-emerald-500 to-emerald-700',
    'from-rose-500 to-rose-700',
    'from-amber-500 to-amber-700',
    'from-cyan-500 to-cyan-700',
    'from-indigo-500 to-indigo-700',
    'from-teal-500 to-teal-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function TenantLoginPage() {
  const { tenantCode } = useParams<{ tenantCode: string }>();
  const { setAuth } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const { data: tenant, isLoading: loadingTenant, isError } = useQuery<TenantInfo>({
    queryKey: ['tenant-info', tenantCode],
    queryFn: async () => (await api.get(`/auth/tenant/${tenantCode}/info`)).data.data,
    retry: false,
    staleTime: Infinity,
  });

  const onSubmit = async ({ email, password }: Form) => {
    setLoginError('');
    try {
      const res = await api.post(`/auth/tenant/${tenantCode}/login`, { email, password });
      const { user, tokens } = res.data.data;
      flushSync(() => setAuth(user, tokens.accessToken, tokens.refreshToken));
      if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (user.role === 'MANAGER') router.push('/manager/dashboard');
      else setLoginError('You are not authorized to access this portal.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(msg ?? 'Invalid email or password.');
    }
  };

  // Invalid workspace
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-4">Workspace &ldquo;{tenantCode}&rdquo; not found.</p>
          <Link href="/admin" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            ← Try a different workspace
          </Link>
        </div>
      </div>
    );
  }

  const initials = tenant ? getInitials(tenant.companyName) : '…';
  const gradientClass = tenant ? getAvatarColor(tenant.companyName) : 'from-slate-600 to-slate-700';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Company branding */}
        <div className="flex flex-col items-center mb-8">
          {loadingTenant ? (
            <div className="h-20 w-20 rounded-2xl bg-slate-800 animate-pulse mb-4" />
          ) : tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.companyName}
              className="h-20 w-20 rounded-2xl object-contain bg-white p-2 shadow-lg mb-4"
            />
          ) : (
            <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg mb-4`}>
              <span className="text-white text-2xl font-bold tracking-tight">{initials}</span>
            </div>
          )}

          {loadingTenant ? (
            <div className="space-y-2 flex flex-col items-center">
              <div className="h-5 w-40 bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-white text-xl font-bold text-center">{tenant?.companyName}</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400 text-xs font-mono">{tenantCode} workspace</span>
              </div>
            </>
          )}
        </div>

        {/* Login card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-white text-lg font-semibold">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to continue to your portal.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {/* Server error */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-xl transition-colors text-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-5 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            <ArrowLeft size={12} />
            Different workspace
          </Link>
        </div>

        <p className="text-center text-slate-700 text-xs mt-4">Powered by FieldEaze</p>
      </div>
    </div>
  );
}
