'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Users, Ticket, HardDrive, DollarSign } from 'lucide-react';
import api from '@/lib/axios';
import { Plan } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

type Form = {
  name: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  price: number;
  managerLimit: number;
  technicianLimit: number;
  ticketLimit: number;
  storageLimitGb: number;
};

const planTierStyle: Record<string, { bg: string; text: string; ring: string }> = {
  STARTER:      { bg: 'bg-[var(--color-surface-elevated)]',   text: 'text-[var(--color-text-secondary)]',  ring: 'ring-slate-200' },
  PROFESSIONAL: { bg: 'bg-[var(--color-surface-elevated)]',     text: 'text-blue-700',   ring: 'ring-blue-200' },
  ENTERPRISE:   { bg: 'bg-[var(--color-surface-elevated)]',   text: 'text-violet-700', ring: 'ring-violet-200' },
};

export default function PlansPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/web/super-admin/plans')).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>();

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      price: plan.price,
      managerLimit: plan.managerLimit,
      technicianLimit: plan.technicianLimit,
      ticketLimit: plan.ticketLimit,
      storageLimitGb: plan.storageLimitGb,
    });
  };

  const saveMutation = useMutation({
    mutationFn: (data: Form) => {
      if (editing) {
        const { name: _n, ...updatePayload } = data;
        return api.patch(`/web/super-admin/plans/${editing.id}`, updatePayload);
      }
      return api.post('/web/super-admin/plans', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success(editing ? 'Plan updated' : 'Plan created');
      setEditing(null); setShowCreate(false); reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (plan: Plan) => api.patch(`/web/super-admin/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); toast.success('Plan status updated'); },
    onError: () => toast.error('Failed'),
  });

  const columns: ColumnDef<Plan, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Plan',
      cell: ({ row }) => {
        const style = planTierStyle[row.original.name] ?? planTierStyle.STARTER;
        return (
          <span className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset',
            style.bg, style.text, style.ring
          )}>
            {row.original.name}
          </span>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Price / mo',
      cell: ({ row }) => (
        <span className="font-semibold text-[var(--color-text-primary)]">₹{row.original.price.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'managerLimit',
      header: 'Managers',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <Users size={12} className="text-[var(--color-text-muted)]" />
          {row.original.managerLimit}
        </div>
      ),
    },
    {
      accessorKey: 'technicianLimit',
      header: 'Technicians',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <Users size={12} className="text-[var(--color-text-muted)]" />
          {row.original.technicianLimit}
        </div>
      ),
    },
    {
      accessorKey: 'ticketLimit',
      header: 'Tickets',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <Ticket size={12} className="text-[var(--color-text-muted)]" />
          {row.original.ticketLimit}
        </div>
      ),
    },
    {
      accessorKey: 'storageLimitGb',
      header: 'Storage',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <HardDrive size={12} className="text-[var(--color-text-muted)]" />
          {row.original.storageLimitGb} GB
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'default'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row.original)}
            title="Edit plan"
          >
            <Pencil size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMutation.mutate(row.original)}
            loading={toggleMutation.isPending}
            className={row.original.isActive
              ? 'text-red-500 hover:bg-[var(--color-surface-elevated)] hover:text-red-600'
              : 'text-emerald-600 hover:bg-[var(--color-surface-elevated)] hover:text-emerald-700'
            }
          >
            {row.original.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const FormFields = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-5">
      {isEdit ? (
        <div className="bg-[var(--color-surface-elevated)] rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Plan Name</p>
          <p className="text-sm font-bold text-[var(--color-text-primary)]">{editing?.name}</p>
        </div>
      ) : (
        <Select
          label="Plan Name"
          options={[
            { value: 'STARTER', label: 'Starter' },
            { value: 'PROFESSIONAL', label: 'Professional' },
            { value: 'ENTERPRISE', label: 'Enterprise' },
          ]}
          {...register('name')}
          error={errors.name?.message}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price (₹ / month)"
          type="number"
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message}
        />
        <Input
          label="Manager Limit"
          type="number"
          {...register('managerLimit', { valueAsNumber: true })}
          error={errors.managerLimit?.message}
        />
        <Input
          label="Technician Limit"
          type="number"
          {...register('technicianLimit', { valueAsNumber: true })}
          error={errors.technicianLimit?.message}
        />
        <Input
          label="Ticket Limit"
          type="number"
          {...register('ticketLimit', { valueAsNumber: true })}
          error={errors.ticketLimit?.message}
        />
        <Input
          label="Storage (GB)"
          type="number"
          {...register('storageLimitGb', { valueAsNumber: true })}
          error={errors.storageLimitGb?.message}
          className="col-span-2"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Subscription Plans</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage plan tiers, limits, and pricing</p>
        </div>
        <Button onClick={() => { setShowCreate(true); reset(); }}>
          <Plus size={15} /> New Plan
        </Button>
      </div>

      <DataTable data={plans} columns={columns} isLoading={isLoading} />

      <Modal
        open={showCreate || !!editing}
        onClose={() => { setShowCreate(false); setEditing(null); reset(); }}
        title={editing ? 'Edit Plan' : 'Create Subscription Plan'}
      >
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-5">
          <FormFields isEdit={!!editing} />
          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--color-border)]">
            <Button
              variant="outline"
              type="button"
              onClick={() => { setShowCreate(false); setEditing(null); reset(); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
