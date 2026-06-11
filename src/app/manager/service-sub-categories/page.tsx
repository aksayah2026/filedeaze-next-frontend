'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import api from '@/lib/axios';
import { ServiceCategory, ServiceSubCategory } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';

type SubForm = { categoryId: string; name: string; isActive?: boolean };
type ChargesForm = { serviceCharge: number; inspectionCharge: number; emergencyCharge: number };

export default function ServiceSubCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ServiceSubCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: categories = [] } = useQuery<ServiceCategory[]>({ queryKey: ['service-categories'], queryFn: async () => (await api.get('/web/manager/service-categories')).data.data });
  const { data = [], isLoading } = useQuery<ServiceSubCategory[]>({
    queryKey: ['sub-categories', categoryFilter],
    queryFn: async () => (await api.get('/web/manager/service-sub-categories', { params: { categoryId: categoryFilter || undefined } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SubForm>();
  const { register: rc, handleSubmit: hc, reset: resetC, formState: { isSubmitting: sc } } = useForm<ChargesForm>();

  const openEdit = (s: ServiceSubCategory) => { setEditing(s); reset({ categoryId: s.categoryId, name: s.name, isActive: s.isActive }); };

  const saveMutation = useMutation({
    mutationFn: (d: SubForm) => editing
      ? api.patch(`/web/manager/service-sub-categories/${editing.id}`, d)
      : api.post('/web/manager/service-sub-categories', { categoryId: d.categoryId, name: d.name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sub-categories'] }); toast.success(editing ? 'Updated' : 'Created'); setEditing(null); setShowCreate(false); reset(); },
    onError: () => toast.error('Failed'),
  });

  const chargesMutation = useMutation({
    mutationFn: (d: ChargesForm) => api.post(`/web/manager/service-charges/${chargingId}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sub-categories'] }); toast.success('Charges saved'); setChargingId(null); resetC(); },
    onError: () => toast.error('Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/service-sub-categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sub-categories'] }); toast.success('Deleted'); setDeleteId(null); },
    onError: () => toast.error('Failed'),
  });

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }));

  const columns: ColumnDef<ServiceSubCategory, unknown>[] = [
    { accessorKey: 'name', header: 'Sub Category' },
    { accessorKey: 'category.name', header: 'Category', cell: ({ row }) => row.original.category?.name ?? '—' },
    { accessorKey: 'serviceCharges', header: 'Service ₹', cell: ({ row }) => { const c = row.original.serviceCharges?.[0]; return c ? `₹${c.serviceCharge}` : '—'; } },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'default'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => { const c = row.original.serviceCharges?.[0]; setChargingId(row.original.id); resetC({ serviceCharge: c?.serviceCharge ?? 0, inspectionCharge: c?.inspectionCharge ?? 0, emergencyCharge: c?.emergencyCharge ?? 0 }); }} title="Set Charges"><DollarSign size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.original.id)} className="text-red-500"><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Sub Categories</h2>
        <Button onClick={() => { setShowCreate(true); reset({ name: '', isActive: true }); }}><Plus size={15} /> New Sub Category</Button>
      </div>
      <div className="mb-4">
        <Select options={[{ value: '', label: 'All Categories' }, ...catOptions]} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-56" />
      </div>
      <DataTable data={data} columns={columns} isLoading={isLoading} />

      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); reset(); }} title={editing ? 'Edit Sub Category' : 'New Sub Category'} size="sm">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <Select label="Category" options={catOptions} placeholder="Select category" {...register('categoryId', { required: true })} />
          <Input label="Name" {...register('name', { required: true })} />
          {editing && <div className="flex items-center gap-2"><input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" /><label htmlFor="isActive" className="text-sm text-gray-700">Active</label></div>}
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setEditing(null); reset(); }}>Cancel</Button><Button type="submit" loading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button></div>
        </form>
      </Modal>

      <Modal open={!!chargingId} onClose={() => { setChargingId(null); resetC(); }} title="Set Service Charges" size="sm">
        <form onSubmit={hc(d => chargesMutation.mutate(d))} className="space-y-4">
          <Input label="Service Charge (₹)" type="number" step="0.01" {...rc('serviceCharge', { valueAsNumber: true })} />
          <Input label="Inspection Charge (₹)" type="number" step="0.01" {...rc('inspectionCharge', { valueAsNumber: true })} />
          <Input label="Emergency Charge (₹)" type="number" step="0.01" {...rc('emergencyCharge', { valueAsNumber: true })} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setChargingId(null); resetC(); }}>Cancel</Button><Button type="submit" loading={sc}>Save</Button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} message="Delete this sub category?" loading={deleteMutation.isPending} />
    </div>
  );
}
