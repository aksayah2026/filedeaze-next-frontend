'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';
import api from '@/lib/axios';
import { Skill } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

type Form = { name: string; description: string; isActive: boolean };

export default function SkillsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Skill | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { data: skills = [], isLoading } = useQuery<Skill[]>({
    queryKey: ['skills', search],
    queryFn: async () => (await api.get('/web/manager/skills', { params: { search: search || undefined } })).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>();

  const openEdit = (s: Skill) => { setEditing(s); reset({ name: s.name, description: s.description ?? '', isActive: s.isActive }); };

  const saveMutation = useMutation({
    mutationFn: (d: Form) => editing ? api.patch(`/web/manager/skills/${editing.id}`, d) : api.post('/web/manager/skills', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); toast.success(editing ? 'Updated' : 'Created'); setEditing(null); setShowCreate(false); reset(); },
    onError: () => toast.error('Failed'),
  });

  const columns: ColumnDef<Skill, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'default'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil size={14} /></Button> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Skills</h2>
        <Button onClick={() => { setShowCreate(true); reset({ name: '', description: '', isActive: true }); }}><Plus size={15} /> New Skill</Button>
      </div>
      <div className="mb-4">
        <Input placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
      </div>
      <DataTable data={skills} columns={columns} isLoading={isLoading} />

      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); reset(); }} title={editing ? 'Edit Skill' : 'New Skill'} size="sm">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
          <Input label="Name" {...register('name', { required: true })} />
          <Textarea label="Description" {...register('description')} />
          {editing && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" />
              <label htmlFor="isActive" className="text-sm text-[var(--color-text-secondary)]">Active</label>
            </div>
          )}
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowCreate(false); setEditing(null); reset(); }}>Cancel</Button><Button type="submit" loading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
