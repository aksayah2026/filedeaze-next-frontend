'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Ban } from 'lucide-react';
import api from '@/lib/axios';
import { AmcPlan, ServiceCategory } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { PaginationMeta } from '@/components/ui/Pagination';

type PlanForm = {
  name: string;
  description: string;
  categoryId: string;
  durationMonths: number;
  visitCount: number;
  price: number;
};

const emptyForm: PlanForm = { name: '', description: '', categoryId: '', durationMonths: 12, visitCount: 4, price: 0 };

export default function AmcPlansPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AmcPlan | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AmcPlan | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PlanForm>({ defaultValues: emptyForm });

  const { data, isLoading, isError, error, refetch } = useQuery<{ items: AmcPlan[]; meta: PaginationMeta }>({
    queryKey: ['amc-plans', page, limit],
    queryFn: async () => (await api.get('/web/manager/amc/plans', { params: { page, limit } })).data.data,
    placeholderData: keepPreviousData,
  });
  const plans = data?.items ?? [];

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/web/manager/service-categories')).data.data,
    enabled: showForm,
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset(emptyForm); };
  const openCreate = () => { reset(emptyForm); setEditing(null); setShowForm(true); };
  const openEdit = (plan: AmcPlan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      description: plan.description ?? '',
      categoryId: plan.categoryId ?? '',
      durationMonths: plan.durationMonths,
      visitCount: plan.visitCount,
      price: plan.price,
    });
    setShowForm(true);
  };

  const createMutation = useMutation({
    mutationFn: (d: PlanForm) => api.post('/web/manager/amc/plans', {
      name: d.name.trim(),
      description: d.description.trim() || undefined,
      categoryId: d.categoryId || undefined,
      durationMonths: Number(d.durationMonths),
      visitCount: Number(d.visitCount),
      price: Number(d.price),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amc-plans'] }); toast.success('AMC plan created'); closeForm(); },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err?.response?.data?.message ?? 'Failed to create plan'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: PlanForm) => api.patch(`/web/manager/amc/plans/${editing!.id}`, {
      name: d.name.trim(),
      description: d.description.trim() || undefined,
      categoryId: d.categoryId || undefined,
      durationMonths: Number(d.durationMonths),
      visitCount: Number(d.visitCount),
      price: Number(d.price),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amc-plans'] }); toast.success('AMC plan updated'); closeForm(); },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err?.response?.data?.message ?? 'Failed to update plan'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/amc/plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['amc-plans'] }); toast.success('AMC plan deactivated'); setDeactivateTarget(null); },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err?.response?.data?.message ?? 'Failed to deactivate plan'),
  });

  const columns: ColumnDef<AmcPlan, unknown>[] = [
    { accessorKey: 'name', header: 'Plan Name' },
    { accessorKey: 'category.name', header: 'Category', cell: ({ row }) => row.original.category?.name ?? 'Any' },
    { accessorKey: 'durationMonths', header: 'Duration', cell: ({ row }) => `${row.original.durationMonths} mo` },
    { accessorKey: 'visitCount', header: 'Visits' },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => `₹${row.original.price.toLocaleString()}` },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => row.original.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="default" showDot={false}>Inactive</Badge> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil size={14} /></Button>
          {row.original.isActive && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeactivateTarget(row.original)}><Ban size={14} /></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">AMC Plans</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Define the maintenance contracts customers can subscribe their assets to</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> New Plan</Button>
      </div>

      <DataTable
        data={plans}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={data?.meta ? { meta: data.meta, onPageChange: setPage, onLimitChange: (l) => { setPage(1); setLimit(l); } } : undefined}
      />

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit AMC Plan' : 'New AMC Plan'} size="md">
        <form onSubmit={handleSubmit(d => editing ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-4">
          <Input label="Plan Name *" placeholder="e.g. Gold AC Care" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Select
            label="Restrict to Category"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Any category"
            {...register('categoryId')}
          />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Duration (months) *" type="number" min={1} error={errors.durationMonths?.message} {...register('durationMonths', { required: true, min: { value: 1, message: 'At least 1 month' } })} />
            <Input label="Visit Count *" type="number" min={1} error={errors.visitCount?.message} {...register('visitCount', { required: true, min: { value: 1, message: 'At least 1 visit' } })} />
            <Input label="Price (₹) *" type="number" min={0} error={errors.price?.message} {...register('price', { required: true, min: { value: 0, message: 'Cannot be negative' } })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : <><Plus size={14} /> Create Plan</>}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        title="Deactivate this plan?"
        message={`"${deactivateTarget?.name}" will no longer be available for new AMC assignments. Existing subscriptions are unaffected.`}
        confirmLabel="Deactivate"
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}
