'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Link from 'next/link';
import { CalendarClock, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import api from '@/lib/axios';
import { AmcSubscription, AmcVisit } from '@/types';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AmcVisitStatusBadge } from '@/components/ui/Badge';

type EnrichedVisit = AmcVisit & { subscription: AmcSubscription };
type RescheduleForm = { scheduledDate: string };

export default function AmcUpcomingVisitsPage() {
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';
  const qc = useQueryClient();
  const [rescheduling, setRescheduling] = useState<EnrichedVisit | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RescheduleForm>();

  const { data: activeSubs = [], isLoading: loadingSubs } = useQuery<AmcSubscription[]>({
    queryKey: ['amc-active-subscriptions'],
    queryFn: async () => (await api.get('/web/manager/amc/subscriptions', { params: { status: 'ACTIVE' } })).data.data,
  });

  const { data: visits = [], isLoading: loadingVisits, isError, error, refetch } = useQuery<EnrichedVisit[]>({
    queryKey: ['amc-upcoming-visits', activeSubs.map(s => s.id)],
    queryFn: async () => {
      const lists = await Promise.all(
        activeSubs.map(async sub => {
          const res = await api.get(`/web/manager/amc/subscriptions/${sub.id}/visits`);
          return (res.data.data as AmcVisit[]).map(v => ({ ...v, subscription: sub }));
        })
      );
      return lists.flat()
        .filter(v => v.status === 'SCHEDULED')
        .sort((a, b) => dayjs(a.scheduledDate).valueOf() - dayjs(b.scheduledDate).valueOf());
    },
    enabled: activeSubs.length > 0,
  });

  const rescheduleMutation = useMutation({
    mutationFn: (d: RescheduleForm) => api.patch(`/web/manager/amc/subscriptions/${rescheduling!.subscription.id}/visits/${rescheduling!.id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amc-upcoming-visits'] });
      toast.success('Visit rescheduled');
      setRescheduling(null); reset();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err?.response?.data?.message ?? 'Failed to reschedule visit'),
  });

  const columns: ColumnDef<EnrichedVisit, unknown>[] = [
    { id: 'ticketNumber', header: 'Ticket #', cell: ({ row }) => row.original.ticket?.ticketNumber ?? '—' },
    { id: 'customer', header: 'Customer', cell: ({ row }) => row.original.subscription.customer?.name ?? '—' },
    { id: 'asset', header: 'Asset', cell: ({ row }) => row.original.subscription.customerAsset?.name ?? '—' },
    { id: 'plan', header: 'Plan', cell: ({ row }) => row.original.subscription.plan?.name ?? '—' },
    { accessorKey: 'visitNumber', header: 'Visit #' },
    { accessorKey: 'scheduledDate', header: 'Scheduled Date', cell: ({ row }) => dayjs(row.original.scheduledDate).format('DD MMM YYYY') },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <AmcVisitStatusBadge status={row.original.status} /> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.ticket && (
            <Link href={`/${prefix}/tickets/${row.original.ticket.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setRescheduling(row.original); reset({ scheduledDate: dayjs(row.original.scheduledDate).format('YYYY-MM-DD') }); }}>
            <CalendarClock size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Upcoming AMC Visits</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">All scheduled maintenance visits across active AMC subscriptions</p>
      </div>

      <DataTable data={visits} columns={columns} isLoading={loadingSubs || loadingVisits} isError={isError} error={error} onRetry={refetch} />

      <Modal open={!!rescheduling} onClose={() => { setRescheduling(null); reset(); }} title="Reschedule Visit" size="sm">
        <form onSubmit={handleSubmit(d => rescheduleMutation.mutate(d))} className="space-y-4">
          <Input label="New Scheduled Date *" type="date" {...register('scheduledDate', { required: true })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setRescheduling(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || rescheduleMutation.isPending}>Reschedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
