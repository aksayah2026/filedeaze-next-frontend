'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Search, Copy, CheckCheck, Link2, Building2 } from 'lucide-react';
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const [manualCode, setManualCode] = useState(false);
  const watchedCompany = watch('companyName');

  useEffect(() => {
    if (manualCode || !watchedCompany) return;
    const suggested = watchedCompany.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    setValue('tenantCode', suggested, { shouldValidate: false });
  }, [watchedCompany, manualCode, setValue]);

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
      setManualCode(false);
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/super-admin/tenants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); toast.success('Tenant deleted'); setDeleteId(null); },
    onError: () => toast.error('Delete failed'),
  });

  const columns: ColumnDef<Tenant, unknown>[] = [
    {
      accessorKey: 'companyName',
      header: 'Company',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
            <Building2 size={13} className="text-[var(--color-primary)]" />
          </div>
          <span className="font-medium text-[var(--color-text-primary)]">{row.original.companyName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'tenantCode',
      header: 'Code',
      cell: ({ row }) => (
        <code className="text-xs bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-md font-mono border border-[var(--color-border)]">
          {row.original.tenantCode}
        </code>
      ),
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <TenantStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'plan.name',
      header: 'Plan',
      cell: ({ row }) => {
        const name = row.original.plan?.name;
        if (!name) return <span className="text-[var(--color-text-muted)]">—</span>;
        const colors: Record<string, string> = {
          STARTER: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
          PROFESSIONAL: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
          ENTERPRISE: 'bg-[rgba(122,90,248,0.12)] text-[#7A5AF8]',
        };
        return (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[name] ?? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]'}`}>
            {name}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-[var(--color-text-muted)] text-xs">
          {dayjs(row.original.createdAt).format('DD MMM YYYY')}
        </span>
      ),
    },
    {
      id: 'loginUrl',
      header: 'Login URL',
      cell: ({ row }) => (
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/admin/${row.original.tenantCode}/login`);
            toast.success('Copied!');
          }}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-mono transition-colors"
          title="Copy login URL"
        >
          /admin/{row.original.tenantCode}/login <Copy size={11} />
        </button>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link href={`/super-admin/tenants/${row.original.id}`}>
            <Button variant="ghost" size="sm" title="View tenant">
              <Eye size={14} />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.original.id)}
            className="text-red-500 hover:bg-[var(--color-surface-elevated)] hover:text-red-600"
            title="Delete tenant"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Tenants</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage all platform tenants</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Tenant
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Search</span>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              placeholder="Company or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-52 rounded-[10px] border border-[var(--color-border-input)] bg-[var(--color-input-bg)] pl-8 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] transition-all"
            />
          </div>
        </div>
        <Select
          label="Status"
          options={[
            { value: '', label: 'All Status' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'EXPIRED', label: 'Expired' },
          ]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-36"
        />
        <Select
          label="Plan"
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
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] invisible">_</span>
          <Button
            variant="secondary"
            onClick={() => setParams({ search, status: statusFilter, plan: planFilter })}
          >
            <Search size={14} /> Apply Filters
          </Button>
        </div>
      </div>

      <DataTable data={tenants} columns={columns} isLoading={isLoading} />

      {/* Create Tenant Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create New Tenant" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name" {...register('companyName')} error={errors.companyName?.message} />
            <div className="flex flex-col gap-1">
              <Input
                label="Tenant Code"
                {...register('tenantCode')}
                error={errors.tenantCode?.message}
                onInput={() => setManualCode(true)}
                placeholder="e.g. acmecorp"
              />
              {!manualCode && watchedCompany && (
                <p className="text-[10px] text-[var(--color-text-muted)]">Auto-generated from company name — edit to customise</p>
              )}
            </div>
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
            <Input label="Address" {...register('address')} error={errors.address?.message} className="sm:col-span-2" />
          </div>

          <div className="pt-1 border-t border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Admin Account</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); reset(); setManualCode(false); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Tenant</Button>
          </div>
        </form>
      </Modal>

      {/* Tenant Created Success Modal */}
      {createdTenant && (
        <Modal open={!!createdTenant} onClose={() => setCreatedTenant(null)} title="Tenant Created" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[var(--color-surface-elevated)] border border-emerald-100 rounded-xl p-4">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCheck size={17} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Workspace is ready</p>
                <p className="text-xs text-emerald-600 mt-0.5">Share the login URL and credentials with the admin.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Workspace</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{createdTenant.companyName}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Login URL</p>
                <div className="flex items-center gap-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2.5">
                  <Link2 size={12} className="text-[var(--color-text-muted)] shrink-0" />
                  <code className="text-xs text-blue-600 flex-1 truncate">{createdTenant.url}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(createdTenant.url); toast.success('URL copied!'); }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">Admin Email</p>
                <div className="flex items-center gap-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2.5">
                  <code className="text-xs text-[var(--color-text-secondary)] flex-1">{createdTenant.adminEmail}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(createdTenant.adminEmail); toast.success('Email copied!'); }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `Workspace: ${createdTenant.companyName}\nLogin URL: ${createdTenant.url}\nAdmin Email: ${createdTenant.adminEmail}`;
                  navigator.clipboard.writeText(text);
                  toast.success('All details copied!');
                }}
                className="flex-1"
              >
                <Copy size={13} /> Copy All
              </Button>
              <Button size="sm" onClick={() => setCreatedTenant(null)} className="flex-1">
                <CheckCheck size={13} /> Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        message="This will soft-delete the tenant and deactivate all users. This action cannot be easily undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
