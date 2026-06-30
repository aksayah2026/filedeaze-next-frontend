'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, usePathname } from 'next/navigation';
import { flushSync } from 'react-dom';
import { Clock, Eye, EyeOff, Loader2, ShieldCheck, Zap } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { TenantBranding } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function isSuperAdminHost(hostname: string): boolean {
  // Bare localhost / 127.0.0.1 (dev with no subdomain) → super admin
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  return (
    hostname === 'admin.localhost' ||
    hostname === 'admin.fieldeaze.com' ||
    hostname === 'fieldeaze.ngstellar.com' ||
    hostname.startsWith('admin.')
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ── Schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, 'Email is required').refine(v => v.includes('@') && v.includes('.'), 'Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

// ── Branding skeleton ──────────────────────────────────────────────────────

function BrandingSkeleton() {
  return (
    <div className="flex flex-col items-center mb-8 animate-pulse">
      <div className="h-20 w-20 rounded-2xl bg-slate-800 mb-4" />
      <div className="h-5 w-36 bg-slate-800 rounded mb-2" />
      <div className="h-3.5 w-24 bg-slate-800 rounded" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { setAuth, clearAuth, user, role, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSuper, setIsSuper] = useState(false);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [brandingState, setBrandingState] = useState<'loading' | 'ok' | 'error'>('loading');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const [showAlreadyIn, setShowAlreadyIn] = useState(false);
  const dashboardPath =
    role === 'SUPER_ADMIN' ? '/super-admin/dashboard' :
    role === 'ADMIN' ? '/admin/dashboard' :
    role === 'MANAGER' ? '/manager/dashboard' : null;

  // Show "already signed in" panel instead of silently redirecting
  useEffect(() => {
    if (isAuthenticated && role && dashboardPath) {
      setShowAlreadyIn(true);
    }
  }, [isAuthenticated, role, dashboardPath]);

  // Detect hostname and (for tenant portals) load branding
  useEffect(() => {
    const hostname = window.location.hostname;
    const isVercelMain = hostname.includes('vercel.app') && !hostname.startsWith('tenant-');
    const superAdmin =
      isSuperAdminHost(hostname) ||
      isVercelMain ||
      pathname?.startsWith('/super-admin') ||
      (isAuthenticated && role === 'SUPER_ADMIN');

    setIsSuper(superAdmin);

    if (superAdmin) {
      setBrandingState('ok');
      return;
    }

    api.get<{ data: TenantBranding }>('/auth/tenant/branding')
      .then(res => {
        setBranding(res.data.data);
        setBrandingState('ok');
      })
      .catch(() => setBrandingState('error'));
  }, [pathname, isAuthenticated, role]);

  const onSubmit = async ({ email, password }: Form) => {
    setLoginError('');
    try {
      if (isSuper) {
        const res = await api.post('/auth/super-admin/login', { email, password });
        const { user, tokens } = res.data.data;
        flushSync(() => setAuth(user, tokens.accessToken, tokens.refreshToken));
        router.push('/super-admin/dashboard');
      } else {
        let tenantCode = branding?.tenantCode;
        if (!tenantCode) {
          const parts = window.location.hostname.split('.');
          if (parts.length >= 2 && parts[0] !== 'admin' && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== '127') {
            tenantCode = parts[0];
          }
        }
        if (!tenantCode) {
          throw new Error('Tenant context could not be resolved.');
        }
        const res = await api.post(`/auth/tenant/${tenantCode}/login`, { email, password });
        const { user, tokens, redirectPath } = res.data.data;
        flushSync(() => setAuth(user, tokens.accessToken, tokens.refreshToken));
        if (user.role === 'ADMIN' || user.role === 'MANAGER') {
          router.push(redirectPath ?? (user.role === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard'));
        } else {
          setLoginError('You are not authorized to access this portal.');
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(msg ?? 'Invalid credentials. Please try again.');
    }
  };

  // Derived accent color — falls back to indigo for super-admin, primary color for tenant
  const accent = isSuper ? '#7c3aed' : (branding?.primaryColor ?? '#4f46e5');
  const accentLight = isSuper ? 'rgba(124,58,237,0.15)' : 'rgba(79,70,229,0.15)';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: `${accent}14` }}
      />

      <div className="relative w-full max-w-sm">

        {/* ── Brand header ── */}
        {brandingState === 'loading' ? (
          <BrandingSkeleton />
        ) : isSuper ? (
          // Super admin branding
          <div className="flex flex-col items-center mb-8">
            <img
              src="/fieldeaze_logo.png"
              alt="FieldEaze Logo"
              className="h-16 w-16 object-contain mb-4"
            />
            <p className="text-white text-2xl font-bold tracking-tight">FieldEaze Platform</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">Platform Administration</p>
          </div>
        ) : brandingState === 'error' ? (
          // Branding failed — generic fallback
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg mb-4">
              <ShieldCheck size={28} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-white text-xl font-bold">Workspace Not Found</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">Check the URL and try again</p>
          </div>
        ) : (
          // Tenant branding
          <div className="flex flex-col items-center mb-8">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="h-20 w-20 rounded-2xl object-contain bg-[var(--color-surface)] p-2 shadow-lg mb-4"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg mb-4 text-white text-2xl font-bold"
                style={{ background: `linear-gradient(135deg, ${accent}, ${branding?.secondaryColor ?? accent}cc)` }}
              >
                {getInitials(branding?.companyName ?? '')}
              </div>
            )}
            <p className="text-white text-2xl font-bold tracking-tight text-center">
              {branding?.companyName}
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">Admin &amp; Manager Portal</p>
            {branding?.status === 'TRIAL' && (
              <div className="mt-3 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                <Clock size={12} className="text-amber-400 shrink-0" />
                <span className="text-amber-400 text-xs font-medium">
                  {(branding.trialDaysLeft ?? 0) > 0
                    ? `Free trial — ${branding.trialDaysLeft} day${branding.trialDaysLeft !== 1 ? 's' : ''} left`
                    : 'Trial expired — subscribe to continue'}
                </span>
              </div>
            )}
            {branding?.status === 'EXPIRED' && (
              <div className="mt-3 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                <Clock size={12} className="text-red-400 shrink-0" />
                <span className="text-red-400 text-xs font-medium">Subscription expired</span>
              </div>
            )}
            {branding?.status === 'PAYMENT_PENDING' && (
              <div className="mt-3 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                <Clock size={12} className="text-blue-400 shrink-0" />
                <span className="text-blue-400 text-xs font-medium">Payment under review</span>
              </div>
            )}
          </div>
        )}

        {/* ── Already signed in panel ── */}
        {showAlreadyIn && dashboardPath ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 text-white text-sm font-bold">
                {user?.name ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : '?'}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{user?.name ?? 'Unknown'}</p>
                <p className="text-slate-400 text-xs">{user?.email}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">You are already signed in. Where would you like to go?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(dashboardPath)}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Continue to Dashboard
              </button>
              <button
                onClick={() => { clearAuth(); setShowAlreadyIn(false); }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Sign in as different account
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Login card ── */}
        {!showAlreadyIn && brandingState !== 'error' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-white text-lg font-semibold">
                {isSuper ? 'Super Admin Sign In' : 'Welcome back'}
              </h2>
              <p className="text-[var(--color-text-muted)] text-sm mt-1">
                {isSuper
                  ? 'Sign in to access the FieldEaze admin dashboard.'
                  : 'Sign in to continue to your portal.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} autoComplete="on" className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={isSuper ? 'superadmin@fieldeaze.com' : 'you@company.com'}
                  {...register('email')}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accentLight}`; }}
                  onBlur={e =>  { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                    onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accentLight}`; }}
                    onBlur={e =>  { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
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
                className="w-full flex items-center justify-center gap-2 text-white font-medium py-3 rounded-xl transition-all text-sm mt-1 disabled:opacity-60"
                style={{ background: isSubmitting ? `${accent}99` : accent }}
                onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-[var(--color-text-secondary)] text-xs mt-6">Powered by FieldEaze</p>
      </div>
    </div>
  );
}
