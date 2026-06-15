'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, Phone, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Ticket, TicketStatus, Customer, ServiceCategory, ServiceSubCategory } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { TicketStatusBadge } from '@/components/ui/Badge';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  ...(['NEW_TICKET', 'ASSIGNED', 'ACCEPTED', 'TRAVELLING', 'REACHED_LOCATION',
    'IN_PROGRESS', 'PENDING', 'COMPLETED', 'INVOICE_GENERATED', 'TICKET_CLOSED', 'CANCELLED'] as TicketStatus[])
    .map(s => ({ value: s, label: s.replace(/_/g, ' ') })),
];

type CreateForm = {
  customerId: string;
  categoryId: string;
  subCategoryId: string;
  description: string;
  priority: string;
  scheduledAt: string;
  serviceAddress: string;
};

export default function TicketsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);

  const { data = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets', params],
    queryFn: async () => (await api.get('/web/manager/tickets', {
      params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    })).data.data,
  });

  // Data for the create form dropdowns
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/web/manager/customers')).data.data,
    enabled: showCreate,
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/web/manager/service-categories')).data.data,
    enabled: showCreate,
  });

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm<CreateForm>({
    defaultValues: { priority: 'MEDIUM' },
  });

  const selectedCategoryId = watch('categoryId');

  const { data: subCategories = [] } = useQuery<ServiceSubCategory[]>({
    queryKey: ['sub-categories', selectedCategoryId],
    queryFn: async () => (await api.get('/web/manager/service-sub-categories', {
      params: { categoryId: selectedCategoryId },
    })).data.data,
    enabled: showCreate && !!selectedCategoryId,
  });

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => api.post('/web/manager/tickets', {
      customerId: d.customerId,
      categoryId: d.categoryId,
      subCategoryId: d.subCategoryId,
      description: d.description,
      priority: d.priority || undefined,
      scheduledAt: d.scheduledAt || undefined,
      serviceAddress: d.serviceAddress || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created successfully');
      setShowCreate(false);
      reset();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to create ticket'),
  });

  const closeModal = () => { setShowCreate(false); reset(); };

  const columns: ColumnDef<Ticket, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket #' },
    { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name },
    { accessorKey: 'technician.name', header: 'Technician', cell: ({ row }) => row.original.technician?.name ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TicketStatusBadge status={row.original.status} /> },
    { accessorKey: 'scheduledAt', header: 'Scheduled', cell: ({ row }) => row.original.scheduledAt ? dayjs(row.original.scheduledAt).format('DD MMM, HH:mm') : '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/manager/tickets/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Tickets</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Phone size={15} /> New Ticket (Call)
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} className="w-48" />
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="secondary" onClick={() => setParams({ status, from, to })}>Filter</Button>
      </div>

      <DataTable data={data} columns={columns} isLoading={isLoading} />

      {/* Create ticket on behalf of customer */}
      <Modal open={showCreate} onClose={closeModal} title="New Ticket — Customer Call" size="md">
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 mb-4">
          <Phone size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Use this form to raise a service ticket on behalf of a customer who called in.
            The ticket will be created under the selected customer's account.
          </p>
        </div>

        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <Select
            label="Customer *"
            options={customers.map(c => ({ value: c.id, label: `${c.name} — ${c.phone}` }))}
            placeholder="Select customer"
            {...register('customerId', { required: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Service Category *"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
              {...register('categoryId', { required: true })}
            />
            <Select
              label="Sub-Category *"
              options={subCategories.map(s => ({ value: s.id, label: s.name }))}
              placeholder={selectedCategoryId ? 'Select sub-category' : 'Select category first'}
              {...register('subCategoryId', { required: true })}
            />
          </div>

          <Textarea
            label="Description *"
            placeholder="Describe the issue reported by the customer..."
            rows={3}
            {...register('description', { required: true })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
              ]}
              {...register('priority')}
            />
            <Input
              label="Scheduled Date & Time"
              type="datetime-local"
              {...register('scheduledAt')}
            />
          </div>

          <Input
            label="Service Address"
            placeholder="Address where service is needed (leave blank to use customer's default)"
            {...register('serviceAddress')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>
              <Plus size={14} /> Create Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
