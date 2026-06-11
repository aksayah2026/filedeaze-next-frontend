'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Tenant } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TenantStatusBadge } from '@/components/ui/Badge';
import dayjs from 'dayjs';

const schema = z.object({
  companyName: z.string().min(1),
  tenantCode: z.string().min(1),
  email: z.string().min(1).refine(v => v.includes('@') && v.includes('.'), 'Invalid email'),
  phone: z.string().min(1),
  address: z.string().min(1),
  adminName: z.string().min(1),
  adminEmail: z.string().min(1).refine(v => v.includes('@') && v.includes('.'), 'Invalid email'),
  adminPassword: z.string().min(6),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
});

type Form = z.infer<typeof schema>;

export default function TenantsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants', statusFilter],
    queryFn: async () => (await api.get('/web/super-admin/tenants', { params: { status: statusFilter || undefined } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (data: Form) => api.post('/web/super-admin/tenants', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); toast.success('Tenant created'); setShowCreate(false); reset(); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/super-admin/tenants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); toast.success('Tenant deleted'); setDeleteId(null); },
    onError: () => toast.error('Delete failed'),
  });

  const columns: ColumnDef<Tenant, unknown>[] = [
    { accessorKey: 'companyName', header: 'Company' },
    { accessorKey: 'tenantCode', header: 'Code' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TenantStatusBadge status={row.original.status} /> },
    { accessorKey: 'plan.name', header: 'Plan', cell: ({ row }) => row.original.plan?.name ?? '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'actions', header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/super-admin/tenants/${row.original.id}`}>
            <Button variant="ghost" size="sm"><Eye size={14} /></Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.original.id)} className="text-red-500">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Tenants</h2>
        <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New Tenant</Button>
      </div>
      <div className="mb-4">
        <Select
          options={[{ value: '', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'EXPIRED', label: 'Expired' }]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>
      <DataTable data={tenants} columns={columns} isLoading={isLoading} />

      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create Tenant" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Input label="Company Name" {...register('companyName')} error={errors.companyName?.message} />
          <Input label="Tenant Code" {...register('tenantCode')} error={errors.tenantCode?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Input label="Address" {...register('address')} error={errors.address?.message} className="col-span-2" />
          <Input label="Admin Name" {...register('adminName')} error={errors.adminName?.message} />
          <Input label="Admin Email" type="email" {...register('adminEmail')} error={errors.adminEmail?.message} />
          <Input label="Admin Password" type="password" {...register('adminPassword')} error={errors.adminPassword?.message} />
          <Select label="Plan" options={[{ value: 'STARTER', label: 'Starter' }, { value: 'PROFESSIONAL', label: 'Professional' }, { value: 'ENTERPRISE', label: 'Enterprise' }]} placeholder="Select Plan" {...register('plan')} />
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Tenant</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        message="This will soft-delete the tenant. This action cannot be undone easily."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
