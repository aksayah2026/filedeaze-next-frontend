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
import { Eye, EyeOff, Loader2, Clock } from 'lucide-react';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
});
type Form = z.infer<typeof schema>;

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
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

  const { data: tenant, isLoading, isError } = useQuery<TenantInfo>({
    queryKey: ['tenant-info', tenantCode],
    queryFn: async () => (await api.get(`/auth/tenant/${tenantCode}/info`)).data.data,
    retry: false,
    staleTime: Infinity,
  });

  const onSubmit = async ({ email, password }: Form) => {
    setLoginError('');
    try {
      const res = await api.post(`/auth/tenant/${tenantCode}/login`, { email, password });
      const { user, tokens, redirectPath } = res.data.data;
      flushSync(() => setAuth(user, tokens.accessToken, tokens.refreshToken));
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        router.push(redirectPath ?? (user.role === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard'));
      } else {
        setLoginError('You are not authorized to access this portal.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setLoginError(axiosErr.response?.data?.message ?? 'Invalid email or password.');
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[var(--color-text-muted)] text-sm mb-4">Workspace &ldquo;{tenantCode}&rdquo; not found.</p>
          <a href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Company branding */}
        <div className="flex flex-col items-center mb-8">
          {isLoading ? (
            <div className="h-20 w-20 rounded-2xl bg-slate-800 animate-pulse mb-4" />
          ) : tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.companyName} className="h-20 w-20 rounded-2xl object-contain bg-[var(--color-surface)] p-2 shadow-lg mb-4" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg mb-4">
              <span className="text-white text-2xl font-bold tracking-tight">{tenant ? getInitials(tenant.companyName) : '…'}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2 flex flex-col items-center">
              <div className="h-5 w-40 bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-white text-xl font-bold text-center">{tenant?.companyName}</h1>
              <p className="text-[var(--color-text-muted)] text-xs mt-1">Admin &amp; Manager Portal</p>
              {tenant?.status === 'TRIAL' && tenant.trialDaysLeft != null && (
                <div className="mt-3 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  <Clock size={12} className="text-amber-400 shrink-0" />
                  <span className="text-amber-400 text-xs font-medium">
                    {tenant.trialDaysLeft > 0
                      ? `Free trial — ${tenant.trialDaysLeft} day${tenant.trialDaysLeft !== 1 ? 's' : ''} left`
                      : 'Trial expired — subscribe to continue'}
                  </span>
                </div>
              )}
              {tenant?.status === 'EXPIRED' && (
                <div className="mt-3 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                  <Clock size={12} className="text-red-400 shrink-0" />
                  <span className="text-red-400 text-xs font-medium">Subscription expired</span>
                </div>
              )}
              {tenant?.status === 'PAYMENT_PENDING' && (
                <div className="mt-3 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                  <Clock size={12} className="text-blue-400 shrink-0" />
                  <span className="text-blue-400 text-xs font-medium">Payment under review</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Login card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-white text-lg font-semibold">Welcome back</h2>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">Sign in to continue to your portal.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="space-y-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-xl transition-colors text-sm mt-2"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--color-text-secondary)] text-xs mt-6">Powered by FieldEaze</p>
      </div>
    </div>
  );
}
