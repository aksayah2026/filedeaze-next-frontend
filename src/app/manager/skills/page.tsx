'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import api from '@/lib/axios';
import { Skill } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import { PaginationMeta } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/lib/utils';

type Form = { name: string; description: string; isActive: boolean };

export default function SkillsPage() {
  const qc = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [editing, setEditing] = useState<Skill | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isError, error, refetch } = useQuery<{ items: Skill[]; meta: PaginationMeta }>({
    queryKey: ['skills', search, page, limit],
    queryFn: async () => (await api.get('/web/manager/skills', { params: { search: search || undefined, page, limit } })).data.data,
    placeholderData: keepPreviousData,
  });

  const skills = data?.items ?? [];

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>();

  const openEdit = (s: Skill) => { setEditing(s); reset({ name: s.name, description: s.description ?? '', isActive: s.isActive }); };

  const saveMutation = useMutation({
    mutationFn: (d: Form) => editing ? api.patch(`/web/manager/skills/${editing.id}`, d) : api.post('/web/manager/skills', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); toast.success(editing ? 'Skill updated' : 'Skill created'); setEditing(null); setShowCreate(false); reset(); },
    onError: (err) => toast.error(getErrorMessage(err, editing ? 'Failed to update skill' : 'Failed to create skill')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/skills/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); toast.success('Skill deleted'); setDeleteTarget(null); },
    // Backend blocks deletion while the skill is still mapped to a technician or sub-category —
    // surface that exact reason instead of a generic failure toast.
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete skill')),
  });

  const columns: ColumnDef<Skill, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'default'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { accessorKey: 'updatedAt', header: 'Updated', cell: ({ row }) => dayjs(row.original.updatedAt).format('DD MMM YYYY') },
    ...(isAdmin ? [{
      id: 'actions', header: '',
      cell: ({ row }: { row: { original: Skill } }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original)} className="text-red-500"><Trash2 size={14} /></Button>
        </div>
      ),
    }] as ColumnDef<Skill, unknown>[] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Skills</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Master list of skills — used by technician assignment and sub-category mapping across the app.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setShowCreate(true); reset({ name: '', description: '', isActive: true }); }}><Plus size={15} /> New Skill</Button>
        )}
      </div>
      <div className="mb-4">
        <Input placeholder="Search skills..." value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} className="w-64" />
      </div>
      <DataTable
        data={skills}
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

      {isAdmin && (
        <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); reset(); }} title={editing ? 'Edit Skill' : 'New Skill'} size="sm">
          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
            <Input label="Skill Name" {...register('name', { required: true })} />
            <Textarea label="Description (optional)" {...register('description')} />
            {editing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" />
                <label htmlFor="isActive" className="text-sm text-[var(--color-text-secondary)]">Active</label>
              </div>
            )}
            <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setEditing(null); reset(); }}>Cancel</Button><Button type="submit" loading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button></div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete skill?"
        message={`Delete "${deleteTarget?.name}"? This can't be undone. If it's still assigned to a technician or mapped to a sub-category, deletion will be blocked — remove those first, or deactivate the skill instead.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
