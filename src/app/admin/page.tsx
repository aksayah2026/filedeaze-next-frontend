'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';

const schema = z.object({
  tenantCode: z.string().min(1, 'Workspace code is required').regex(/^[a-z0-9-]+$/i, 'Only letters, numbers and hyphens allowed'),
});
type Form = z.infer<typeof schema>;

export default function WorkspacePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [checking, setChecking] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ tenantCode }: Form) => {
    setServerError('');
    setChecking(true);
    try {
      await api.get(`/auth/tenant/${tenantCode.toLowerCase()}/info`);
      router.push(`/admin/${tenantCode.toLowerCase()}/login`);
    } catch {
      setServerError('Workspace not found. Check the code and try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
            <Zap size={28} className="text-white" />
          </div>
          <p className="text-white text-2xl font-bold tracking-tight">FieldEaze</p>
          <p className="text-slate-500 text-sm mt-1">Field Service Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold">Sign in to your workspace</h2>
            <p className="text-slate-400 text-sm mt-1.5">Enter your workspace code to continue.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Workspace Code</label>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
                <span className="px-3 py-3 text-slate-500 text-sm border-r border-slate-700 select-none whitespace-nowrap">
                  fieldeaze.app/
                </span>
                <input
                  {...register('tenantCode')}
                  placeholder="your-workspace"
                  autoComplete="off"
                  autoFocus
                  className="flex-1 bg-transparent px-3 py-3 text-white text-sm outline-none placeholder-slate-600"
                />
              </div>
              {errors.tenantCode && (
                <p className="text-red-400 text-xs mt-2">{errors.tenantCode.message}</p>
              )}
              {serverError && (
                <p className="text-red-400 text-xs mt-2">{serverError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {checking ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Checking workspace…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Don&apos;t have a workspace?{' '}
          <a href="mailto:support@fieldeaze.com" className="text-slate-400 hover:text-white transition-colors">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
