'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { flushSync } from 'react-dom';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Zap } from 'lucide-react';

const schema = z.object({
  email: z.string().min(1, 'Email required').refine(v => v.includes('@') && v.includes('.'), 'Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type Form = z.infer<typeof schema>;

export default function SuperAdminLogin() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const { setAuth } = useAuth();
  const router = useRouter();

  const onSubmit = async (data: Form) => {
    try {
      const res = await api.post('/auth/super-admin/login', data);
      const { user, tokens } = res.data.data;
      flushSync(() => setAuth(user, tokens.accessToken, tokens.refreshToken));
      router.push('/super-admin/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-violet-500 flex items-center justify-center mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">FieldEaze</h1>
          <p className="text-sm text-slate-400 mt-1">Super Admin Portal</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow-2xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Sign In</h2>
          <Input label="Email" type="email" placeholder="admin@fieldeaze.com" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
          <Button type="submit" loading={isSubmitting} className="w-full mt-2">Sign In</Button>
        </form>
      </div>
    </div>
  );
}
