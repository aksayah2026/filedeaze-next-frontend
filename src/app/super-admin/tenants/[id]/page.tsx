'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Tenant, TenantStatus } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TenantStatusBadge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import dayjs from 'dayjs';
import { useEffect } from 'react';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => (await api.get(`/web/super-admin/tenants/${id}`)).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<Tenant>>();

  useEffect(() => {
    if (tenant) reset({ companyName: tenant.companyName, email: tenant.email, phone: tenant.phone, address: tenant.address });
  }, [tenant, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) => api.patch(`/web/super-admin/tenants/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Tenant updated'); },
    onError: () => toast.error('Update failed'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TenantStatus) => api.patch(`/web/super-admin/tenants/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed'),
  });

  if (isLoading || !tenant) return <PageSpinner />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{tenant.companyName}</h2>
          <p className="text-sm text-gray-400">{tenant.tenantCode}</p>
        </div>
        <TenantStatusBadge status={tenant.status} />
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Edit Details</h3>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Input label="Company Name" {...register('companyName')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Address" {...register('address')} />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Change Status</h3>
        <div className="flex gap-3">
          {(['ACTIVE', 'SUSPENDED', 'EXPIRED'] as TenantStatus[]).map(s => (
            <Button
              key={s}
              variant={tenant.status === s ? 'primary' : 'outline'}
              size="sm"
              onClick={() => statusMutation.mutate(s)}
              loading={statusMutation.isPending}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-3">Subscription Info</h3>
        {tenant.subscription ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Plan:</span> <span className="font-medium">{tenant.subscription.plan?.name}</span></div>
            <div><span className="text-gray-500">Start:</span> <span className="font-medium">{dayjs(tenant.subscription.startDate).format('DD MMM YYYY')}</span></div>
            <div><span className="text-gray-500">End:</span> <span className="font-medium">{dayjs(tenant.subscription.endDate).format('DD MMM YYYY')}</span></div>
            <div><span className="text-gray-500">Active:</span> <span className="font-medium">{tenant.subscription.isActive ? 'Yes' : 'No'}</span></div>
          </div>
        ) : <p className="text-sm text-gray-400">No active subscription</p>}
      </div>
    </div>
  );
}
