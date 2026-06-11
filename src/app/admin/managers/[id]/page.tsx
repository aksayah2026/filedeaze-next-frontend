'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useEffect } from 'react';
import api from '@/lib/axios';
import { Manager } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';

export default function ManagerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Manager>({
    queryKey: ['manager', id],
    queryFn: async () => (await api.get(`/web/admin/managers/${id}`)).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Pick<Manager, 'name' | 'phone' | 'isActive'>>();
  useEffect(() => { if (data) reset({ name: data.name, phone: data.phone, isActive: data.isActive }); }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (d: Pick<Manager, 'name' | 'phone' | 'isActive'>) => api.patch(`/web/admin/managers/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager', id] }); toast.success('Updated'); },
    onError: () => toast.error('Failed'),
  });

  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-800">{data.name}</h2>
        <Badge variant={data.isActive ? 'success' : 'default'}>{data.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <Input label="Name" {...register('name')} />
          <Input label="Phone" {...register('phone')} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end"><Button type="submit" loading={isSubmitting}>Save</Button></div>
        </form>
      </div>
    </div>
  );
}
