'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Tenant, TenantStatus, Plan, Billing } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge, TenantStatusBadge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { Users, CreditCard, Calendar } from 'lucide-react';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => (await api.get(`/web/super-admin/tenants/${id}`)).data.data,
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/web/super-admin/plans')).data.data,
  });

  const { data: billings = [] } = useQuery<Billing[]>({
    queryKey: ['tenant-billings', id],
    queryFn: async () => {
      const res = await api.get(`/web/super-admin/billing`, { params: { tenantId: id } });
      const d = res.data.data;
      return Array.isArray(d) ? d : (d?.billings ?? d?.items ?? []);
    },
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

  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => api.patch(`/web/super-admin/tenants/${id}/plan`, { planId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Plan updated'); },
    onError: () => toast.error('Failed to change plan'),
  });

  const billingColumns: ColumnDef<Billing, unknown>[] = [
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${row.original.amount.toLocaleString()}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'PAID' ? 'success' : 'warning'}>{row.original.status}</Badge> },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => dayjs(row.original.dueDate).format('DD MMM YYYY') },
    { accessorKey: 'paidAt', header: 'Paid At', cell: ({ row }) => row.original.paidAt ? dayjs(row.original.paidAt).format('DD MMM YYYY') : '—' },
  ];

  if (isLoading || !tenant) return <PageSpinner />;

  const planOptions = plans.map(p => ({ value: p.id, label: `${p.name} — ₹${p.price}` }));

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{tenant.companyName}</h2>
          <p className="text-sm text-gray-400">{tenant.tenantCode}</p>
        </div>
        <TenantStatusBadge status={tenant.status} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Current Plan</p>
            <p className="text-sm font-semibold text-gray-800">{tenant.subscription?.plan?.name ?? '—'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Calendar size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Subscription End</p>
            <p className="text-sm font-semibold text-gray-800">
              {tenant.subscription?.endDate ? dayjs(tenant.subscription.endDate).format('DD MMM YYYY') : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <Users size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Billing Records</p>
            <p className="text-sm font-semibold text-gray-800">{billings.length}</p>
          </div>
        </div>
      </div>

      {/* Edit Details */}
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

      {/* Change Status */}
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

      {/* Change Plan */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Change Plan</h3>
        {tenant.subscription ? (
          <div className="flex gap-3 items-end">
            <Select
              label="Select New Plan"
              options={planOptions}
              defaultValue={tenant.subscription.planId}
              onChange={e => changePlanMutation.mutate(e.target.value)}
              className="w-64"
            />
            {changePlanMutation.isPending && <p className="text-xs text-gray-400 pb-2">Updating…</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No active subscription — create one from the Subscriptions page.</p>
        )}
      </div>

      {/* Subscription Info */}
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

      {/* Billing History */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Billing History</h3>
        {billings.length === 0 ? (
          <p className="text-sm text-gray-400">No billing records found.</p>
        ) : (
          <DataTable data={billings} columns={billingColumns} isLoading={false} />
        )}
      </div>
    </div>
  );
}
