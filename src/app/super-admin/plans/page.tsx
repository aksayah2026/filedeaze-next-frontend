'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';
import api from '@/lib/axios';
import { Plan } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

type Form = {
  name: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  price: number;
  managerLimit: number;
  technicianLimit: number;
  ticketLimit: number;
  storageLimitGb: number;
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
    reset({ name: plan.name, price: plan.price, managerLimit: plan.managerLimit, technicianLimit: plan.technicianLimit, ticketLimit: plan.ticketLimit, storageLimitGb: plan.storageLimitGb });
  };

  const saveMutation = useMutation({
    mutationFn: (data: Form) => editing
      ? api.patch(`/web/super-admin/plans/${editing.id}`, data)
      : api.post('/web/super-admin/plans', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      toast.success(editing ? 'Plan updated' : 'Plan created');
      setEditing(null); setShowCreate(false); reset();
    },
    onError: () => toast.error('Failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (plan: Plan) => api.patch(`/web/super-admin/plans/${plan.id}`, { isActive: !plan.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); toast.success('Plan status updated'); },
    onError: () => toast.error('Failed'),
  });

  const columns: ColumnDef<Plan, unknown>[] = [
    { accessorKey: 'name', header: 'Plan' },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => `₹${row.original.price}` },
    { accessorKey: 'managerLimit', header: 'Managers' },
    { accessorKey: 'technicianLimit', header: 'Technicians' },
    { accessorKey: 'ticketLimit', header: 'Tickets' },
    { accessorKey: 'storageLimitGb', header: 'Storage (GB)' },
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMutation.mutate(row.original)}
            loading={toggleMutation.isPending}
            className={row.original.isActive ? 'text-red-500' : 'text-green-600'}
          >
            {row.original.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const FormFields = () => (
    <>
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
      <Input label="Price (₹)" type="number" {...register('price')} error={errors.price?.message} />
      <Input label="Manager Limit" type="number" {...register('managerLimit')} error={errors.managerLimit?.message} />
      <Input label="Technician Limit" type="number" {...register('technicianLimit')} error={errors.technicianLimit?.message} />
      <Input label="Ticket Limit" type="number" {...register('ticketLimit')} error={errors.ticketLimit?.message} />
      <Input label="Storage (GB)" type="number" {...register('storageLimitGb')} error={errors.storageLimitGb?.message} />
    </>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Plans</h2>
        <Button onClick={() => { setShowCreate(true); reset(); }}><Plus size={15} /> New Plan</Button>
      </div>
      <DataTable data={plans} columns={columns} isLoading={isLoading} />

      <Modal
        open={showCreate || !!editing}
        onClose={() => { setShowCreate(false); setEditing(null); reset(); }}
        title={editing ? 'Edit Plan' : 'Create Plan'}
      >
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <FormFields />
          <div className="col-span-2 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setEditing(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
