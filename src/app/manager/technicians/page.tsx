'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Technician } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Star } from 'lucide-react';
import dayjs from 'dayjs';

const schema = z.object({
  name: z.string().min(1, 'Name is required (e.g. Siva Kumar)'),
  email: z.string().min(1, 'Email is required').refine(v => v.includes('@') && v.includes('.'), 'Enter a valid email (e.g. siva@gmail.com)'),
  phone: z.string().min(10, 'Enter a valid phone number (e.g. 9876543210)').max(15, 'Phone number too long'),
  password: z.string().min(6, 'Password must be at least 6 characters (e.g. Siva@123)'),
});

type Form = z.infer<typeof schema>;

export default function TechniciansPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: techs = [], isLoading } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: async () => (await api.get('/web/manager/technicians')).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: Form) => api.post('/web/manager/technicians', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); toast.success('Technician added'); setShowCreate(false); reset(); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/technicians/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['technicians'] }); toast.success('Deleted'); setDeleteId(null); },
    onError: () => toast.error('Failed'),
  });

  const columns: ColumnDef<Technician, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'danger'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
    { accessorKey: 'rating', header: 'Rating', cell: ({ row }) => row.original.rating ? <div className="flex items-center gap-1"><Star size={12} className="fill-yellow-400 text-yellow-400" />{row.original.rating.toFixed(1)}</div> : '—' },
    { accessorKey: 'createdAt', header: 'Joined', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/manager/technicians/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.original.id)} className="text-red-500"><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Technicians</h2>
        <Button onClick={() => setShowCreate(true)}><Plus size={15} /> Add Technician</Button>
      </div>
      <DataTable data={techs} columns={columns} isLoading={isLoading} />

      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Add Technician">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button><Button type="submit" loading={isSubmitting}>Add</Button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} message="Remove this technician?" loading={deleteMutation.isPending} />
    </div>
  );
}
