'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertTriangle, Eye, Phone, Plus } from 'lucide-react';
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

type NewCustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export default function TicketsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';
  const searchParams = useSearchParams();
  const initialExpiredOnly = searchParams.get('expired') === 'true';
  const [expiredOnly] = useState(initialExpiredOnly);
  const [params, setParams] = useState<Record<string, string>>(initialExpiredOnly ? { expiredOnly: 'true' } : {});
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState<NewCustomerForm>({ name: '', phone: '', email: '', address: '' });

  const { data: response, isLoading } = useQuery<{ data: Ticket[]; meta: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: ['tickets', params, page],
    queryFn: async () => (await api.get('/web/manager/tickets', {
      params: { ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(page) },
    })).data,
  });

  const data = response?.data ?? [];
  const meta = response?.meta;

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

  const { register, handleSubmit, watch, reset, setValue, formState: { isSubmitting } } = useForm<CreateForm>({
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

  const createCustomerMutation = useMutation({
    mutationFn: (d: NewCustomerForm) =>
      api.post('/web/manager/customers', {
        name: d.name.trim(),
        phone: d.phone.trim(),
        ...(d.email.trim() && { email: d.email.trim() }),
        ...(d.address.trim() && { address: d.address.trim() }),
      }),
    onSuccess: (res) => {
      const created = res.data.data as Customer;
      qc.invalidateQueries({ queryKey: ['customers-list'] });
      setValue('customerId', created.id);
      if (created.address) setValue('serviceAddress', created.address);
      setShowNewCustomer(false);
      setNewCust({ name: '', phone: '', email: '', address: '' });
      toast.success(`Customer "${created.name}" added`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to create customer'),
  });

  const closeModal = () => { setShowCreate(false); setShowNewCustomer(false); setNewCust({ name: '', phone: '', email: '', address: '' }); reset(); };

  const columns: ColumnDef<Ticket, unknown>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket #' },
    { accessorKey: 'customer.name', header: 'Customer', cell: ({ row }) => row.original.customer?.name },
    { accessorKey: 'technician.name', header: 'Technician', cell: ({ row }) => row.original.technician?.name ?? '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TicketStatusBadge status={row.original.status} /> },
    { accessorKey: 'scheduledAt', header: 'Scheduled', cell: ({ row }) => row.original.scheduledAt ? dayjs(row.original.scheduledAt).format('DD MMM, HH:mm') : '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/${prefix}/tickets/${row.original.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Tickets</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Phone size={15} /> New Ticket (Call)
        </Button>
      </div>

      {expiredOnly && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 mb-4 text-sm text-rose-700">
          <AlertTriangle size={14} className="shrink-0" />
          Showing tickets whose assignment expired and are still waiting for reassignment.
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4 items-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Status</span>
          <Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} className="w-48" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">From</span>
          <Input
            type="date"
            value={from}
            onChange={e => {
              const val = e.target.value;
              setFrom(val);
              if (to && val > to) {
                setTo(val);
              }
            }}
            max={to || undefined}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">To</span>
          <Input
            type="date"
            value={to}
            onChange={e => {
              const val = e.target.value;
              setTo(val);
              if (from && val < from) {
                setFrom(val);
              }
            }}
            min={from || undefined}
            className="w-40"
          />
        </div>
        <Button variant="secondary" onClick={() => { setPage(1); setParams({ status, from, to }); }}>Filter</Button>
      </div>

      <DataTable data={data} columns={columns} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[var(--color-text-muted)]">
          <span>{meta.total} tickets</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</Button>
            <span>Page {page} of {meta.totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* Create ticket on behalf of customer */}
      <Modal open={showCreate} onClose={closeModal} title="New Ticket — Customer Call" size="md">
        <div className="flex items-start gap-2 rounded-lg bg-[var(--color-surface-elevated)] border border-blue-100 px-3 py-2 mb-4">
          <Phone size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Use this form to raise a service ticket on behalf of a customer who called in.
            The ticket will be created under the selected customer's account.
          </p>
        </div>

        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <Select
              label="Customer *"
              options={customers.map(c => ({ value: c.id, label: `${c.name} — ${c.phone ?? ''}` }))}
              placeholder="Select customer"
              {...register('customerId', { required: true })}
            />
            {!showNewCustomer ? (
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus size={12} /> New Customer
              </button>
            ) : (
              <div className="mt-2 p-3 border border-blue-200 rounded-lg bg-[var(--color-surface-elevated)] space-y-2">
                <Input
                  placeholder="Name *"
                  value={newCust.name}
                  onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))}
                />
                <Input
                  placeholder="Phone *"
                  value={newCust.phone}
                  onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email * (e.g. ravi@gmail.com)"
                  value={newCust.email}
                  onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))}
                />
                <Input
                  placeholder="Address (e.g. 12 Gandhi Street, Chennai) *"
                  value={newCust.address}
                  onChange={e => setNewCust(p => ({ ...p, address: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    loading={createCustomerMutation.isPending}
                    onClick={() => {
                      if (!newCust.name.trim() || !newCust.phone.trim()) {
                        toast.error('Name and phone are required');
                        return;
                      }
                      if (!newCust.email.trim()) {
                        toast.error('Email is required to send the service request confirmation');
                        return;
                      }
                      if (!newCust.address.trim()) {
                        toast.error('Address is required so the technician knows where to go');
                        return;
                      }
                      createCustomerMutation.mutate(newCust);
                    }}
                  >
                    Add Customer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => { setShowNewCustomer(false); setNewCust({ name: '', phone: '', email: '', address: '' }); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

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
