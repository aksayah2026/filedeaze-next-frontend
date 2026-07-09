'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Ticket, HardDrive, ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';
import { Plan } from '@/types';
import { PlanBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

type Form = {
  name: string;
  price: number;
  managerLimit: number;
  technicianLimit: number;
  ticketLimit: number;
  customerLimit: number;
  storageLimitGb: number;
  durationDays: number | null;
  isTrial: boolean;
  isActive: boolean;
};

const lim = (v: number) => (v >= 99999 ? 'Unlimited' : v.toLocaleString());


export default function PlansPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/web/super-admin/plans')).data.data,
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    defaultValues: { isTrial: false, isActive: true, durationDays: null },
  });
  const watchIsTrial = watch('isTrial');
  const watchIsActive = watch('isActive');

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      price: plan.price,
      managerLimit: plan.managerLimit,
      technicianLimit: plan.technicianLimit,
      ticketLimit: plan.ticketLimit,
      customerLimit: (plan as any).customerLimit ?? 99999,
      storageLimitGb: plan.storageLimitGb,
      durationDays: (plan as any).durationDays ?? null,
      isTrial: (plan as any).isTrial ?? false,
      isActive: plan.isActive ?? true,
    });
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['plans'] });
    qc.invalidateQueries({ queryKey: ['tenants'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: (data: Form) => {
      const clean = { ...data, durationDays: data.durationDays || undefined, isTrial: data.isTrial ?? false, isActive: data.isActive ?? true };
      if (editing) {
        const { name: _n, ...payload } = clean;
        return api.patch(`/web/super-admin/plans/${editing.id}`, payload);
      }
      return api.post('/web/super-admin/plans', clean);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'Plan updated' : 'Plan created');
      setEditing(null); setShowCreate(false); reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (plan: Plan) => api.patch(`/web/super-admin/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => { invalidate(); toast.success('Plan status updated'); },
    onError: () => toast.error('Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/super-admin/plans/${id}`),
    onSuccess: () => { invalidate(); toast.success('Plan deleted'); setDeleteTarget(null); },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Failed to delete plan'); setDeleteTarget(null); },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Subscription Plans</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Manage plan tiers, limits, and pricing</p>
        </div>
        <Button onClick={() => { setShowCreate(true); reset(); }}>
          <Plus size={15} /> New Plan
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                {['Plan', 'Price / mo', 'Managers', 'Technicians', 'Tickets', 'Customers', 'Storage', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-[var(--color-surface-elevated)] rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : plans.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-14 text-center text-sm text-[var(--color-text-muted)]">No plans yet. Create one to get started.</td></tr>
              ) : plans.map(plan => (
                <tr key={plan.id} className="hover:bg-[var(--color-surface-elevated)] transition-colors">
                  {/* Plan name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <PlanBadge planName={plan.name} />
                      {(plan as any).isTrial && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">Trial</span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4 font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                    ₹{Number(plan.price).toLocaleString()}
                  </td>

                  {/* Managers */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Users size={12} className="text-[var(--color-text-muted)]" />
                      {lim(plan.managerLimit)}
                    </div>
                  </td>

                  {/* Technicians */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Users size={12} className="text-[var(--color-text-muted)]" />
                      {lim(plan.technicianLimit)}
                    </div>
                  </td>

                  {/* Tickets */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Ticket size={12} className="text-[var(--color-text-muted)]" />
                      {lim(plan.ticketLimit)}
                    </div>
                  </td>

                  {/* Customers */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Users size={12} className="text-[var(--color-text-muted)]" />
                      {lim((plan as any).customerLimit ?? 99999)}
                    </div>
                  </td>

                  {/* Storage */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <HardDrive size={12} className="text-[var(--color-text-muted)]" />
                      {plan.storageLimitGb} GB
                    </div>
                  </td>

                  {/* Active toggle */}
                  <td className="px-5 py-4">
                    <button
                      className="flex items-center gap-2"
                      onClick={() => toggleMutation.mutate(plan)}
                      disabled={toggleMutation.isPending}
                      title={plan.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <div className={`relative h-5 w-10 rounded-full transition-colors ${plan.isActive ? 'bg-blue-500' : 'bg-gray-300'} ${toggleMutation.isPending ? 'opacity-50' : ''}`}>
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${plan.isActive ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className={`text-xs font-medium ${plan.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(plan)}
                        className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                        title="Edit plan"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(plan)}
                        className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-red-300 hover:text-red-500 transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && plans.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showCreate || !!editing}
        onClose={() => { setShowCreate(false); setEditing(null); reset(); }}
        title={editing ? 'Edit Plan' : 'Create Subscription Plan'}
      >
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-5">
          {editing ? (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-elevated)] px-4 py-3">
              <ShieldCheck size={14} className="text-[var(--color-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{editing.name}</span>
              <span className="text-xs text-[var(--color-text-muted)] ml-1">— name cannot be changed</span>
            </div>
          ) : (
            <Input
              label="Plan Name *"
              placeholder="e.g. STARTER, GOLD, ENTERPRISE"
              {...register('name', { required: 'Plan name is required', maxLength: { value: 50, message: 'Max 50 characters' } })}
              error={errors.name?.message}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹ / month) *" type="number" {...register('price', { valueAsNumber: true, required: 'Price is required', min: { value: 1, message: 'Price must be greater than 0' } })} error={errors.price?.message} />
            <Input label="Manager Limit *" type="number" {...register('managerLimit', { valueAsNumber: true, required: 'Manager limit is required', min: { value: 1, message: 'Manager limit must be greater than 0' } })} error={errors.managerLimit?.message} />
            <Input label="Technician Limit *" type="number" {...register('technicianLimit', { valueAsNumber: true, required: 'Technician limit is required', min: { value: 1, message: 'Technician limit must be greater than 0' } })} error={errors.technicianLimit?.message} />
            <Input label="Ticket Limit *" type="number" {...register('ticketLimit', { valueAsNumber: true, required: 'Ticket limit is required', min: { value: 1, message: 'Ticket limit must be greater than 0' } })} error={errors.ticketLimit?.message} />
            <Input label="Customer Limit *" type="number" {...register('customerLimit', { valueAsNumber: true, required: 'Customer limit is required', min: { value: 1, message: 'Customer limit must be greater than 0' } })} error={errors.customerLimit?.message} />
            <Input label="Storage (GB) *" type="number" {...register('storageLimitGb', { valueAsNumber: true, required: 'Storage limit is required', min: { value: 1, message: 'Storage limit must be greater than 0' } })} error={errors.storageLimitGb?.message} />
          </div>

          {/* Make Active + Free Trial toggles — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Make Active?</p>
                <p className="text-xs text-[var(--color-text-muted)]">Visible to tenants</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="sr-only peer" {...register('isActive')} />
                <div className={cn(
                  'relative h-5 w-10 rounded-full bg-gray-200 transition-colors',
                  'after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[""]',
                  'peer-checked:bg-blue-500 peer-checked:after:translate-x-5',
                )} />
                <span className={`text-xs font-medium ${watchIsActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {watchIsActive ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Free Trial Plan?</p>
                <p className="text-xs text-[var(--color-text-muted)]">{watchIsTrial ? 'Trial period' : 'Paid plan'}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="sr-only peer" {...register('isTrial')} />
                <div className={cn(
                  'relative h-5 w-10 rounded-full bg-gray-200 transition-colors',
                  'after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[""]',
                  'peer-checked:bg-blue-500 peer-checked:after:translate-x-5',
                )} />
                <span className={`text-xs font-medium ${watchIsTrial ? 'text-blue-600' : 'text-gray-400'}`}>
                  {watchIsTrial ? 'Trial' : 'Standard'}
                </span>
              </label>
            </div>
          </div>

          {/* Duration */}
          <Input
            label={watchIsTrial ? 'Trial Duration (Days) *' : 'Active Duration (Days)'}
            type="number"
            placeholder={watchIsTrial ? 'e.g. 30' : 'e.g. 365 (optional)'}
            {...register('durationDays', {
              required: watchIsTrial ? 'Trial duration is required' : false,
              min: { value: 1, message: 'Must be at least 1 day' },
              setValueAs: v => (v === '' || v === null || v === undefined ? null : isNaN(Number(v)) ? null : Number(v)),
            })}
            error={errors.durationDays?.message}
          />

          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--color-border)]">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); setEditing(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Delete Plan"
        message={`Delete "${deleteTarget?.name}"? Plans with active subscriptions cannot be deleted — deactivate instead.`}
        confirmLabel="Delete Plan"
      />
    </div>
  );
}
