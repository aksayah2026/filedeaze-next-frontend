'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

export default function WorkspaceSelectorPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = code.trim().toLowerCase();
    if (!slug) { setError('Please enter a workspace code.'); return; }

    setError('');
    setChecking(true);
    try {
      await api.get(`/auth/tenant/${slug}/info`);
      router.push(`/admin/${slug}/login`);
    } catch {
      setError(`Workspace "${slug}" not found. Check the code and try again.`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <p className="text-white text-2xl font-bold tracking-tight">FieldEaze</p>
          <p className="text-slate-400 text-sm mt-1">Enter your workspace to continue</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-1">Sign in to your workspace</h2>
          <p className="text-slate-400 text-sm mb-6">Enter the workspace code provided by your administrator.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Workspace code</label>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="e.g. ramco"
                autoFocus
                autoComplete="off"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
              />
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={checking || !code.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {checking
                ? <><Loader2 size={15} className="animate-spin" /> Checking…</>
                : <> Continue <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Platform admin?{' '}
          <a href="/login" className="text-slate-400 hover:text-slate-300 transition-colors">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
