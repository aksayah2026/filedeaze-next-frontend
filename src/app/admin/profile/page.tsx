'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { User } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { PageSpinner } from '@/components/ui/Spinner';

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<User>({
    queryKey: ['admin-profile'],
    queryFn: async () => (await api.get('/web/admin/profile')).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Pick<User, 'name' | 'email' | 'phone'>>();

  useEffect(() => { if (data) reset({ name: data.name, email: data.email, phone: data.phone }); }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (d: Pick<User, 'name' | 'email' | 'phone'>) => api.patch('/web/admin/profile', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-profile'] }); toast.success('Profile updated'); },
    onError: () => toast.error('Failed'),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/web/admin/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-profile'] }); toast.success('Photo updated'); },
    onError: () => toast.error('Upload failed'),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">My Profile</h2>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <FileUpload label="Profile Photo" onFile={file => photoMutation.mutate(file)} loading={photoMutation.isPending} preview={data?.photo} />
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <Input label="Name" {...register('name')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Phone" {...register('phone')} />
          <div className="flex justify-end"><Button type="submit" loading={isSubmitting}>Save</Button></div>
        </form>
      </div>
    </div>
  );
}
