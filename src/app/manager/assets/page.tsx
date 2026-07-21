'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2, Plus, X as XIcon, Box, ChevronDown, Layers, Sparkles, ImagePlus } from 'lucide-react';
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
import { cn } from '@/lib/utils';
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

type BulkAssetRow = {
  key: string;
  name: string;
  categoryId: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
};

type BulkRowError = { row: number; field: string; message: string };

const makeEmptyBulkRow = (): BulkAssetRow => ({
  key: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `row-${Date.now()}-${Math.random()}`,
  name: '', categoryId: '', brand: '', model: '', serialNumber: '', purchaseDate: '',
});

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

  // Photos on the Add/Edit Asset form: staged locally (with preview URLs) until the asset exists,
  // then uploaded via the same endpoint the asset detail page uses. In edit mode the asset already
  // has an id, so new files upload immediately instead of staging.
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [stagedPhotos, setStagedPhotos] = useState<{ file: File; previewUrl: string }[]>([]);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [showMultiForm, setShowMultiForm] = useState(false);
  const [multiCustomerId, setMultiCustomerId] = useState('');
  const [multiRows, setMultiRows] = useState<BulkAssetRow[]>([]);
  const [bulkErrors, setBulkErrors] = useState<BulkRowError[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!addMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [addMenuOpen]);

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
    enabled: showForm || showMultiForm,
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/web/manager/service-categories')).data.data,
    enabled: showForm || showMultiForm,
  });

  const clearStagedPhotos = () => {
    stagedPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setStagedPhotos([]);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); reset(emptyForm); clearStagedPhotos(); };

  const openCreate = () => { reset({ ...emptyForm, customerId: lockedCustomerId }); setEditing(null); clearStagedPhotos(); setShowForm(true); };

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
    clearStagedPhotos();
    setShowForm(true);
  };

  const onPhotoFilesSelected = async (files: FileList) => {
    const fileArray = Array.from(files);
    if (editing) {
      // Asset already exists — upload immediately, same as the detail page's "Add Photos".
      try {
        await uploadPhotosMutation.mutateAsync({ assetId: editing.id, files: fileArray });
        await refreshEditingAsset();
        toast.success('Photos uploaded');
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e?.response?.data?.message ?? 'Failed to upload photos');
      }
    } else {
      // No asset yet — stage locally, uploaded once the asset is created on submit.
      setStagedPhotos(prev => [...prev, ...fileArray.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    }
  };

  const removeStagedPhoto = (previewUrl: string) => {
    setStagedPhotos(prev => {
      const target = prev.find(p => p.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(p => p.previewUrl !== previewUrl);
    });
  };

  const openMultiCreate = () => {
    setMultiCustomerId(lockedCustomerId);
    setMultiRows([makeEmptyBulkRow(), makeEmptyBulkRow(), makeEmptyBulkRow()]);
    setBulkErrors([]);
    setShowMultiForm(true);
  };

  const closeMultiForm = () => {
    setShowMultiForm(false);
    setMultiCustomerId('');
    setMultiRows([]);
    setBulkErrors([]);
  };

  const addMultiRow = () => setMultiRows(rows => [...rows, makeEmptyBulkRow()]);

  const removeMultiRow = (key: string) =>
    setMultiRows(rows => (rows.length > 1 ? rows.filter(r => r.key !== key) : rows));

  const updateMultiRow = (key: string, field: keyof Omit<BulkAssetRow, 'key'>, value: string) => {
    const rowIndex = multiRows.findIndex(r => r.key === key);
    setMultiRows(rows => rows.map(r => (r.key === key ? { ...r, [field]: value } : r)));
    if (rowIndex !== -1) {
      setBulkErrors(errs => errs.filter(e => !(e.row === rowIndex + 1 && e.field === field)));
    }
  };

  const bulkErrorFor = (rowIndex: number, field: string) =>
    bulkErrors.find(e => e.row === rowIndex + 1 && e.field === field)?.message;

  const uploadPhotosMutation = useMutation({
    mutationFn: ({ assetId, files }: { assetId: string; files: File[] }) => {
      const fd = new FormData();
      files.forEach((file) => fd.append('images', file));
      // 'Content-Type': false (not undefined!) — axios's dispatchRequest.js unconditionally defaults
      // Content-Type to 'application/x-www-form-urlencoded' for every POST/PUT/PATCH request whose
      // header is currently undefined; `false` is axios's real "never auto-fill this" sentinel, which
      // survives that check and still gets stripped from the final request so the browser computes
      // the actual multipart boundary itself. Confirmed via runtime logging — see detail page.
      return api.post(`/web/manager/customer-assets/${assetId}/images`, fd, { headers: { 'Content-Type': false } });
    },
  });

  const removePhotoMutation = useMutation({
    mutationFn: (imageId: string) => api.delete(`/web/manager/customer-assets/${editing!.id}/images/${imageId}`),
    onSuccess: async () => { await refreshEditingAsset(); },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to remove photo'),
  });

  // `editing` is a local snapshot taken when the modal opened, not a live query result — after
  // adding/removing a photo it needs to be re-fetched so the modal reflects the change immediately.
  const refreshEditingAsset = async () => {
    if (!editing) return;
    const res = await api.get(`/web/manager/customer-assets/${editing.id}`);
    setEditing(res.data.data);
    qc.invalidateQueries({ queryKey: ['customer-asset', editing.id] });
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
    onSuccess: async (res) => {
      const newAssetId = res.data.data.id as string;
      if (stagedPhotos.length) {
        try {
          await uploadPhotosMutation.mutateAsync({ assetId: newAssetId, files: stagedPhotos.map(p => p.file) });
        } catch {
          toast.error('Asset saved, but photo upload failed — add photos from the asset detail page.');
        }
      }
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

  const bulkCreateMutation = useMutation({
    mutationFn: () => api.post('/web/manager/customer-assets/bulk', {
      customerId: multiCustomerId,
      assets: multiRows.map(r => ({
        name: r.name.trim(),
        categoryId: r.categoryId || undefined,
        brand: r.brand.trim() || undefined,
        model: r.model.trim() || undefined,
        serialNumber: r.serialNumber.trim() || undefined,
        purchaseDate: r.purchaseDate || undefined,
      })),
    }),
    onSuccess: (res) => {
      const { createdCount, assets: created } = res.data.data as { createdCount: number; assets: CustomerAsset[] };
      qc.invalidateQueries({ queryKey: ['customer-assets'] });
      toast.success(`${createdCount} asset${createdCount === 1 ? '' : 's'} created successfully.`);
      setHighlightedIds(new Set(created.map(a => a.id)));
      setTimeout(() => setHighlightedIds(new Set()), 5000);
      closeMultiForm();
    },
    onError: (err: { response?: { data?: { errors?: BulkRowError[]; message?: string } } }) => {
      const rowErrors = err?.response?.data?.errors;
      if (rowErrors && rowErrors.length > 0 && rowErrors[0]?.row !== undefined) {
        setBulkErrors(rowErrors);
        toast.error('Please fix the highlighted rows.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to create assets');
      }
    },
  });

  const handleBulkSave = () => {
    if (!multiCustomerId) { toast.error('Select a customer'); return; }
    bulkCreateMutation.mutate();
  };

  const columns: ColumnDef<CustomerAsset, unknown>[] = [
    {
      accessorKey: 'name', header: 'Asset',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          {row.original.name}
          {highlightedIds.has(row.original.id) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)] text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wide">
              <Sparkles size={10} /> New
            </span>
          )}
        </span>
      ),
    },
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
        <div className="relative" ref={addMenuRef}>
          <Button onClick={() => setAddMenuOpen(o => !o)}>
            <Plus size={15} /> Add Asset
            <ChevronDown size={14} className={cn('transition-transform duration-150', addMenuOpen && 'rotate-180')} />
          </Button>
          {addMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.12)] z-20 overflow-hidden">
              <button
                type="button"
                onClick={() => { setAddMenuOpen(false); openCreate(); }}
                className="w-full text-left px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] flex items-center gap-2.5 transition-colors"
              >
                <Plus size={15} className="text-[var(--color-text-muted)]" />
                <div>
                  <div className="font-medium">Add Single Asset</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Create one asset at a time</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setAddMenuOpen(false); openMultiCreate(); }}
                className="w-full text-left px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] flex items-center gap-2.5 border-t border-[var(--color-border)] transition-colors"
              >
                <Layers size={15} className="text-[var(--color-text-muted)]" />
                <div>
                  <div className="font-medium">Add Multiple Assets</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Create several assets at once</div>
                </div>
              </button>
            </div>
          )}
        </div>
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
            <Input label="Purchase Date" type="date" autoComplete="off" max={dayjs().format('YYYY-MM-DD')} {...register('purchaseDate')} />
          </div>

          <Textarea label="Installation Address" placeholder="Where this asset is installed" rows={2} {...register('installationAddress')} />
          <Textarea label="Notes" placeholder="Any additional notes" rows={2} {...register('notes')} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">Photos</label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) onPhotoFilesSelected(e.target.files);
                  e.target.value = '';
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => photoInputRef.current?.click()}
                loading={uploadPhotosMutation.isPending}
              >
                <ImagePlus size={13} /> Add Photos
              </Button>
            </div>
            {(editing?.images?.length || stagedPhotos.length) ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {editing?.images?.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-border)]">
                    <img src={img.imageUrl} alt="Asset" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhotoMutation.mutate(img.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
                {stagedPhotos.map((p) => (
                  <div key={p.previewUrl} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-border)]">
                    <img src={p.previewUrl} alt="Pending upload" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeStagedPhoto(p.previewUrl)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">No photos added yet</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : <><Plus size={14} /> Add Asset</>}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showMultiForm} onClose={closeMultiForm} title="Add Multiple Assets" size="xl">
        <form onSubmit={e => { e.preventDefault(); handleBulkSave(); }} className="space-y-4">
          {lockedCustomerId ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] rounded-lg px-3 py-2">
              <Box size={14} className="text-[var(--color-text-muted)]" />
              Customer: <span className="font-medium">{customers.find(c => c.id === lockedCustomerId)?.name ?? '—'}</span>
            </div>
          ) : (
            <Select
              label="Customer *"
              options={customers.map(c => ({ value: c.id, label: `${c.name} — ${c.phone ?? ''}` }))}
              placeholder="Select customer"
              value={multiCustomerId}
              onChange={e => setMultiCustomerId(e.target.value)}
            />
          )}

          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-surface-elevated)]/80">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider min-w-[160px]">Asset Name *</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider min-w-[140px]">Category</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider min-w-[130px]">Brand</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider min-w-[130px]">Model</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider min-w-[150px]">Serial Number</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider min-w-[150px]">Purchase Date</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {multiRows.map((row, idx) => (
                  <tr key={row.key} className={idx % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-elevated)]/40'}>
                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="e.g. Living Room AC"
                        value={row.name}
                        onChange={e => updateMultiRow(row.key, 'name', e.target.value)}
                        error={bulkErrorFor(idx, 'name')}
                        autoFocus={idx === 0}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Select
                        options={categories.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="Select"
                        value={row.categoryId}
                        onChange={e => updateMultiRow(row.key, 'categoryId', e.target.value)}
                        error={bulkErrorFor(idx, 'categoryId')}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="e.g. Daikin"
                        value={row.brand}
                        onChange={e => updateMultiRow(row.key, 'brand', e.target.value)}
                        error={bulkErrorFor(idx, 'brand')}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="e.g. FTKF50"
                        value={row.model}
                        onChange={e => updateMultiRow(row.key, 'model', e.target.value)}
                        error={bulkErrorFor(idx, 'model')}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        placeholder="e.g. SN-2024-00123"
                        value={row.serialNumber}
                        onChange={e => updateMultiRow(row.key, 'serialNumber', e.target.value)}
                        error={bulkErrorFor(idx, 'serialNumber')}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="date"
                        autoComplete="off"
                        max={dayjs().format('YYYY-MM-DD')}
                        value={row.purchaseDate}
                        onChange={e => updateMultiRow(row.key, 'purchaseDate', e.target.value)}
                        error={bulkErrorFor(idx, 'purchaseDate')}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        disabled={multiRows.length === 1}
                        onClick={() => removeMultiRow(row.key)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={addMultiRow}>
            <Plus size={14} /> Add Another Row
          </Button>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeMultiForm}>Cancel</Button>
            <Button type="submit" loading={bulkCreateMutation.isPending} disabled={bulkCreateMutation.isPending}>
              Save All ({multiRows.length} Asset{multiRows.length === 1 ? '' : 's'})
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
