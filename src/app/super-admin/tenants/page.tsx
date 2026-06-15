'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Search, Copy, CheckCheck, Link2 } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [params, setParams] = useState({ search: '', status: '', plan: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants', params],
    queryFn: async () => (await api.get('/web/super-admin/tenants', {
      params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    })).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const [createdTenant, setCreatedTenant] = useState<{ url: string; companyName: string; adminEmail: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: Form) => api.post('/web/super-admin/tenants', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const url = `${baseUrl}/admin/${vars.tenantCode}/login`;
      setCreatedTenant({ url, companyName: vars.companyName, adminEmail: vars.adminEmail });
      setShowCreate(false);
      reset();
    },
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
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TenantStatusBadge status={row.original.status} /> },
    { accessorKey: 'plan.name', header: 'Plan', cell: ({ row }) => row.original.plan?.name ?? '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'loginUrl',
      header: 'Login URL',
      cell: ({ row }) => (
        <button
          onClick={() => { navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/admin/${row.original.tenantCode}/login`); toast.success('Copied!'); }}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-mono transition-colors"
          title="Copy login URL"
        >
          /admin/{row.original.tenantCode}/login <Copy size={11} />
        </button>
      ),
    },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Input
          placeholder="Search company or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-56"
        />
        <Select
          options={[
            { value: '', label: 'All Status' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'EXPIRED', label: 'Expired' },
          ]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: 'All Plans' },
            { value: 'STARTER', label: 'Starter' },
            { value: 'PROFESSIONAL', label: 'Professional' },
            { value: 'ENTERPRISE', label: 'Enterprise' },
          ]}
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="w-40"
        />
        <Button
          variant="secondary"
          onClick={() => setParams({ search, status: statusFilter, plan: planFilter })}
        >
          <Search size={14} /> Search
        </Button>
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
          <Select
            label="Plan"
            options={[
              { value: 'STARTER', label: 'Starter' },
              { value: 'PROFESSIONAL', label: 'Professional' },
              { value: 'ENTERPRISE', label: 'Enterprise' },
            ]}
            placeholder="Select Plan"
            {...register('plan')}
          />
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Tenant</Button>
          </div>
        </form>
      </Modal>

      {/* Tenant created success modal */}
      {createdTenant && (
        <Modal open={!!createdTenant} onClose={() => setCreatedTenant(null)} title="Tenant Created Successfully" size="sm">
          <div className="space-y-4">

            {/* Header banner */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCheck size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Workspace is ready</p>
                <p className="text-xs text-green-600 mt-0.5">Share the login URL and credentials with the admin.</p>
              </div>
            </div>

            {/* Workspace */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Workspace</p>
              <p className="text-base font-semibold text-gray-800">{createdTenant.companyName}</p>
            </div>

            {/* Login URL */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Login URL</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <Link2 size={13} className="text-gray-400 shrink-0" />
                <code className="text-sm text-blue-600 flex-1 truncate">{createdTenant.url}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(createdTenant.url); toast.success('URL copied!'); }}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  title="Copy URL"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Admin Email */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Admin Email</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <code className="text-sm text-gray-700 flex-1">{createdTenant.adminEmail}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(createdTenant.adminEmail); toast.success('Email copied!'); }}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  title="Copy email"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                variant="secondary"
                onClick={() => {
                  const text = `Workspace: ${createdTenant.companyName}\nLogin URL: ${createdTenant.url}\nAdmin Email: ${createdTenant.adminEmail}`;
                  navigator.clipboard.writeText(text);
                  toast.success('All details copied!');
                }}
              >
                <Copy size={14} /> Copy All
              </Button>
              <Button onClick={() => setCreatedTenant(null)}>
                <CheckCheck size={14} /> Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
