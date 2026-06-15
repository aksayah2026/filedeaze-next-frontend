'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Ticket, Technician, TicketImage } from '@/types';
import { TicketStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageSpinner } from '@/components/ui/Spinner';
import { Star, CheckCircle, XCircle, RefreshCw, UserCheck } from 'lucide-react';
import dayjs from 'dayjs';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [isReassign, setIsReassign] = useState(false);

  const { data: ticket, isLoading } = useQuery<Ticket>({ queryKey: ['ticket', id], queryFn: async () => (await api.get(`/web/manager/tickets/${id}`)).data.data });
  const { data: techs = [] } = useQuery<Technician[]>({ queryKey: ['technicians'], queryFn: async () => (await api.get('/web/manager/technicians')).data.data });

  const { register: ra, handleSubmit: ha, reset: resetA, formState: { isSubmitting: sa } } = useForm<{ technicianId: string; scheduledAt: string }>();
  const { register: rc, handleSubmit: hc, reset: resetC, formState: { isSubmitting: sc } } = useForm<{ notes: string }>();
  const { register: rx, handleSubmit: hx, reset: resetX, formState: { isSubmitting: sx } } = useForm<{ reason: string }>();

  const assignMutation = useMutation({
    mutationFn: (d: { technicianId: string; scheduledAt: string }) => api.patch(`/web/manager/tickets/${id}/${isReassign ? 'reassign' : 'assign'}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success(isReassign ? 'Reassigned' : 'Assigned'); setShowAssign(false); resetA(); },
    onError: () => toast.error('Failed'),
  });

  const closeMutation = useMutation({
    mutationFn: (d: { notes: string }) => api.patch(`/web/manager/tickets/${id}/close`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Ticket closed'); setShowClose(false); resetC(); },
    onError: () => toast.error('Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (d: { reason: string }) => api.patch(`/web/manager/tickets/${id}/cancel`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Ticket cancelled'); setShowCancel(false); resetX(); },
    onError: () => toast.error('Failed'),
  });

  if (isLoading || !ticket) return <PageSpinner />;

  const canAssign = ticket.status === 'NEW_TICKET';
  const canReassign = ticket.status === 'ASSIGNED' || ticket.status === 'ACCEPTED';
  const canClose = ticket.status === 'INVOICE_GENERATED';
  const canCancel = !['COMPLETED', 'TICKET_CLOSED', 'CANCELLED'].includes(ticket.status);

  const techOptions = techs.filter(t => t.isActive).map(t => ({ value: t.id, label: t.name }));

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-mono">{ticket.ticketNumber}</p>
          <h2 className="text-xl font-semibold text-gray-800 mt-0.5">{ticket.customer?.name}</h2>
          <p className="text-sm text-gray-500">{ticket.customer?.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TicketStatusBadge status={ticket.status} />
          <div className="flex gap-2">
            {canAssign && <Button size="sm" onClick={() => { setIsReassign(false); setShowAssign(true); }}><UserCheck size={13} /> Assign</Button>}
            {canReassign && <Button size="sm" variant="secondary" onClick={() => { setIsReassign(true); setShowAssign(true); }}><RefreshCw size={13} /> Reassign</Button>}
            {canClose && <Button size="sm" variant="secondary" onClick={() => setShowClose(true)}><CheckCircle size={13} /> Close</Button>}
            {canCancel && <Button size="sm" variant="danger" onClick={() => setShowCancel(true)}><XCircle size={13} /> Cancel</Button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-sm space-y-2">
          <h3 className="font-medium text-gray-700">Details</h3>
          <div className="text-gray-600 space-y-1">
            <p><span className="text-gray-400">Category:</span> {ticket.serviceCategory?.name ?? '—'}</p>
            <p><span className="text-gray-400">Sub Category:</span> {ticket.subCategory?.name ?? '—'}</p>
            <p><span className="text-gray-400">Technician:</span> {ticket.technician?.name ?? 'Unassigned'}</p>
            <p><span className="text-gray-400">Scheduled:</span> {ticket.scheduledAt ? dayjs(ticket.scheduledAt).format('DD MMM YYYY, HH:mm') : '—'}</p>
            <p><span className="text-gray-400">Created:</span> {dayjs(ticket.createdAt).format('DD MMM YYYY, HH:mm')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-sm space-y-2">
          <h3 className="font-medium text-gray-700">Payment</h3>
          {ticket.payment ? (
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center gap-2"><PaymentStatusBadge status={ticket.payment.status} /></div>
              <p><span className="text-gray-400">Amount:</span> ₹{ticket.payment.amount.toLocaleString()}</p>
              <p><span className="text-gray-400">Method:</span> {ticket.payment.method ?? '—'}</p>
            </div>
          ) : <p className="text-gray-400">No payment yet</p>}

          {ticket.feedback && (
            <>
              <h3 className="font-medium text-gray-700 mt-3">Feedback</h3>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < ticket.feedback!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
                <span className="text-gray-500 ml-1 text-xs">{ticket.feedback.review}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-3">Status Timeline</h3>
        <div className="space-y-3">
          {(ticket.statusLogs ?? []).map((log, i) => (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                {i < (ticket.statusLogs?.length ?? 0) - 1 && <div className="flex-1 w-px bg-gray-200 mt-1" />}
              </div>
              <div className="pb-3">
                <TicketStatusBadge status={log.status} />
                <p className="text-xs text-gray-400 mt-0.5">{dayjs(log.createdAt).format('DD MMM YYYY, HH:mm')}</p>
                {log.notes && <p className="text-xs text-gray-500 mt-0.5">{log.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {ticket.images && ticket.images.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3">Work Photos</h3>
          <div className="grid grid-cols-2 gap-4">
            {(['BEFORE', 'AFTER'] as TicketImage['type'][]).map(type => {
              const img = ticket.images!.find(i => i.type === type);
              return (
                <div key={type}>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">{type}</p>
                  {img ? (
                    <a href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img src={img.imageUrl} alt={type} className="rounded-lg w-full object-cover aspect-video border border-gray-100 hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 aspect-video flex items-center justify-center">
                      <p className="text-xs text-gray-400">No photo</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {ticket.images.find(i => i.type === 'SIGNATURE') && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Customer Signature</p>
              <a href={ticket.images.find(i => i.type === 'SIGNATURE')!.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={ticket.images.find(i => i.type === 'SIGNATURE')!.imageUrl} alt="Signature" className="rounded-lg h-20 border border-gray-100 hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}
        </div>
      )}

      <Modal open={showAssign} onClose={() => { setShowAssign(false); resetA(); }} title={isReassign ? 'Reassign Ticket' : 'Assign Ticket'} size="sm">
        <form onSubmit={ha(d => assignMutation.mutate(d))} className="space-y-4">
          <Select label="Technician" options={techOptions} placeholder="Select technician" {...ra('technicianId', { required: true })} />
          <Input label="Scheduled At" type="datetime-local" {...ra('scheduledAt')} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowAssign(false); resetA(); }}>Cancel</Button><Button type="submit" loading={sa}>{isReassign ? 'Reassign' : 'Assign'}</Button></div>
        </form>
      </Modal>

      <Modal open={showClose} onClose={() => { setShowClose(false); resetC(); }} title="Close Ticket" size="sm">
        <form onSubmit={hc(d => closeMutation.mutate(d))} className="space-y-4">
          <Textarea label="Notes (optional)" {...rc('notes')} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowClose(false); resetC(); }}>Cancel</Button><Button type="submit" loading={sc}>Close Ticket</Button></div>
        </form>
      </Modal>

      <Modal open={showCancel} onClose={() => { setShowCancel(false); resetX(); }} title="Cancel Ticket" size="sm">
        <form onSubmit={hx(d => cancelMutation.mutate(d))} className="space-y-4">
          <Textarea label="Reason" {...rx('reason', { required: true })} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowCancel(false); resetX(); }}>Cancel</Button><Button variant="danger" type="submit" loading={sx}>Cancel Ticket</Button></div>
        </form>
      </Modal>
    </div>
  );
}
