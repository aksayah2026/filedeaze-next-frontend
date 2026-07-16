'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2, Plus, X as XIcon, Box } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { CustomerAsset, Customer, ServiceCategory } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PaginationMeta } from '@/components/ui/Pagination';
import dayjs from 'dayjs';

type AssetForm = {
  customerId: string;
  categoryId: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  installationAddress: string;
  notes: string;
};

const emptyForm: AssetForm = {
  customerId: '', categoryId: '', name: '', brand: '', model: '',
  serialNumber: '', purchaseDate: '', installationAddress: '', notes: '',
};

export default function CustomerAssetsPage() {
  const qc = useQueryClient();
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';
  const searchParams = useSearchParams();
  const lockedCustomerId = searchParams.get('customerId') ?? '';

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomerAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerAsset | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssetForm>({ defaultValues: emptyForm });

  useEffect(() => {
    if (searchParams.get('openCreate') === 'true') {
      reset({ ...emptyForm, customerId: lockedCustomerId });
      setEditing(null);
      setShowForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery<{ items: CustomerAsset[]; meta: PaginationMeta }>({
    queryKey: ['customer-assets', lockedCustomerId, query, page, limit],
    queryFn: async () => (await api.get('/web/manager/customer-assets', {
      params: { customerId: lockedCustomerId || undefined, search: query || undefined, page, limit },
    })).data.data,
    placeholderData: keepPreviousData,
  });

  const assets = data?.items ?? [];

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && assets.length > 0) {
      const target = assets.find(a => a.id === editId);
      if (target) openEdit(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/web/manager/customers')).data.data,
    enabled: showForm,
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/web/manager/service-categories')).data.data,
    enabled: showForm,
  });

  const closeForm = () => { setShowForm(false); setEditing(null); reset(emptyForm); };

  const openCreate = () => { reset({ ...emptyForm, customerId: lockedCustomerId }); setEditing(null); setShowForm(true); };

  const openEdit = (asset: CustomerAsset) => {
    setEditing(asset);
    reset({
      customerId: asset.customerId,
      categoryId: asset.categoryId ?? '',
      name: asset.name,
      brand: asset.brand ?? '',
      model: asset.model ?? '',
      serialNumber: asset.serialNumber ?? '',
      purchaseDate: asset.purchaseDate ? dayjs(asset.purchaseDate).format('YYYY-MM-DD') : '',
      installationAddress: asset.installationAddress ?? '',
      notes: asset.notes ?? '',
    });
    setShowForm(true);
  };

  const createMutation = useMutation({
    mutationFn: (d: AssetForm) => api.post('/web/manager/customer-assets', {
      customerId: d.customerId,
      categoryId: d.categoryId || undefined,
      name: d.name.trim(),
      brand: d.brand.trim() || undefined,
      model: d.model.trim() || undefined,
      serialNumber: d.serialNumber.trim() || undefined,
      purchaseDate: d.purchaseDate || undefined,
      installationAddress: d.installationAddress.trim() || undefined,
      notes: d.notes.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-assets'] });
      toast.success('Asset added successfully');
      closeForm();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to add asset'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: AssetForm) => api.patch(`/web/manager/customer-assets/${editing!.id}`, {
      categoryId: d.categoryId || undefined,
      name: d.name.trim(),
      brand: d.brand.trim() || undefined,
      model: d.model.trim() || undefined,
      serialNumber: d.serialNumber.trim() || undefined,
      purchaseDate: d.purchaseDate || undefined,
      installationAddress: d.installationAddress.trim() || undefined,
      notes: d.notes.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-assets'] });
      toast.success('Asset updated successfully');
      closeForm();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update asset'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/customer-assets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-assets'] });
      toast.success('Asset removed');
      setDeleteTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to remove asset'),
  });

  const columns: ColumnDef<CustomerAsset, unknown>[] = [
    { accessorKey: 'name', header: 'Asset' },
    { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name ?? '—' },
    { accessorKey: 'category.name', header: 'Category', cell: ({ row }) => row.original.category?.name ?? '—' },
    { id: 'brandModel', header: 'Brand / Model', cell: ({ row }) => [row.original.brand, row.original.model].filter(Boolean).join(' / ') || '—' },
    { accessorKey: 'serialNumber', header: 'Serial #', cell: ({ row }) => row.original.serialNumber ?? '—' },
    { accessorKey: 'createdAt', header: 'Added', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link href={`/${prefix}/assets/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(row.original)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Customer Assets</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Track the equipment installed at each customer's premises</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Add Asset</Button>
      </div>

      {lockedCustomerId && (
        <div className="flex items-center gap-2 mb-4 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 w-fit">
          Filtered by customer
          <Link href={`/${prefix}/assets`} className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline">
            <XIcon size={12} /> Clear
          </Link>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <Input placeholder="Search by name, brand, model, or serial #..." value={search} onChange={e => setSearch(e.target.value)} className="w-80" />
        <Button variant="secondary" onClick={() => { setPage(1); setQuery(search); }}>Search</Button>
      </div>

      <DataTable
        data={assets}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={data?.meta ? {
          meta: data.meta,
          onPageChange: setPage,
          onLimitChange: (l) => { setPage(1); setLimit(l); },
        } : undefined}
      />

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Asset' : 'Add Asset'} size="md">
        <form onSubmit={handleSubmit(d => editing ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-4">
          {editing ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] rounded-lg px-3 py-2">
              <Box size={14} className="text-[var(--color-text-muted)]" />
              Owner: <span className="font-medium">{editing.customer?.name}</span>
            </div>
          ) : (
            <Select
              label="Customer *"
              options={customers.map(c => ({ value: c.id, label: `${c.name} — ${c.phone ?? ''}` }))}
              placeholder="Select customer"
              disabled={!!lockedCustomerId}
              error={errors.customerId?.message}
              {...register('customerId', { required: 'Customer is required' })}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Asset Name *" placeholder="e.g. Living Room AC" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
            <Select
              label="Category"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
              {...register('categoryId')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" placeholder="e.g. Daikin" {...register('brand')} />
            <Input label="Model" placeholder="e.g. FTKF50" {...register('model')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Serial Number" placeholder="e.g. SN-2024-00123" {...register('serialNumber')} />
            <Input label="Purchase Date" type="date" {...register('purchaseDate')} />
          </div>

          <Textarea label="Installation Address" placeholder="Where this asset is installed" rows={2} {...register('installationAddress')} />
          <Textarea label="Notes" placeholder="Any additional notes" rows={2} {...register('notes')} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : <><Plus size={14} /> Add Asset</>}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Remove this asset?"
        message={`"${deleteTarget?.name}" will be deactivated and hidden from active lists. This cannot be undone from here.`}
        confirmLabel="Remove"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
