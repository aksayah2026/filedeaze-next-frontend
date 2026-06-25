'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { Offer } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import dayjs from 'dayjs';

type Form = {
  title: string; description: string; offerType: 'SERVICE' | 'CATEGORY' | 'GENERAL';
  discountType: 'PERCENTAGE' | 'FLAT'; discountValue: number;
  startDate: string; endDate: string; isRecurring: boolean;
};

export default function OffersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Offer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery<Offer[]>({
    queryKey: ['offers'],
    queryFn: async () => (await api.get('/web/offers')).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>();

  const openEdit = (o: Offer) => {
    setEditing(o);
    reset({ title: o.title, description: o.description, offerType: o.offerType, discountType: o.discountType, discountValue: o.discountValue, startDate: o.startDate.slice(0, 10), endDate: o.endDate.slice(0, 10), isRecurring: o.isRecurring });
  };

  const saveMutation = useMutation({
    mutationFn: (d: Form) => editing ? api.patch(`/web/offers/${editing.id}`, d) : api.post('/web/offers', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); toast.success(editing ? 'Updated' : 'Created'); setEditing(null); setShowCreate(false); reset(); },
    onError: () => toast.error('Failed'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/offers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); toast.success('Offer deactivated'); setDeleteId(null); },
    onError: () => toast.error('Failed'),
  });

  const columns: ColumnDef<Offer, unknown>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'offerType', header: 'Type' },
    { accessorKey: 'discountType', header: 'Discount', cell: ({ row }) => `${row.original.discountValue}${row.original.discountType === 'PERCENTAGE' ? '%' : '₹'}` },
    { accessorKey: 'startDate', header: 'Start', cell: ({ row }) => dayjs(row.original.startDate).format('DD MMM YYYY') },
    { accessorKey: 'endDate', header: 'End', cell: ({ row }) => dayjs(row.original.endDate).format('DD MMM YYYY') },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'default'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil size={14} /></Button>
          {row.original.isActive && <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.original.id)} className="text-red-500"><Trash2 size={14} /></Button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Offers</h2>
        <Button onClick={() => { setShowCreate(true); reset({ discountType: 'PERCENTAGE', offerType: 'GENERAL', isRecurring: false }); }}><Plus size={15} /> New Offer</Button>
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />

      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); reset(); }} title={editing ? 'Edit Offer' : 'New Offer'} size="lg">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Input label="Title" {...register('title', { required: true })} className="col-span-2" />
          <Textarea label="Description" {...register('description')} className="col-span-2" />
          <Select label="Offer Type" options={[{ value: 'GENERAL', label: 'General' }, { value: 'SERVICE', label: 'Service' }, { value: 'CATEGORY', label: 'Category' }]} {...register('offerType')} />
          <Select label="Discount Type" options={[{ value: 'PERCENTAGE', label: 'Percentage (%)' }, { value: 'FLAT', label: 'Flat (₹)' }]} {...register('discountType')} />
          <Input label="Discount Value" type="number" step="0.01" {...register('discountValue', { valueAsNumber: true, required: true })} />
          <div />
          <Input label="Start Date" type="date" {...register('startDate', { required: true })} />
          <Input label="End Date" type="date" {...register('endDate', { required: true })} />
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="isRecurring" {...register('isRecurring')} className="h-4 w-4" />
            <label htmlFor="isRecurring" className="text-sm text-[var(--color-text-secondary)]">Recurring offer</label>
          </div>
          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setEditing(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deactivateMutation.mutate(deleteId)} message="This will deactivate the offer." confirmLabel="Deactivate" loading={deactivateMutation.isPending} />
    </div>
  );
}
