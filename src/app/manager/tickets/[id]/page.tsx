'use client';

import { useState, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Ticket, Technician, TicketImage } from '@/types';
import { TicketStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageSpinner } from '@/components/ui/Spinner';
import { Star, CheckCircle, XCircle, RefreshCw, UserCheck, ChevronLeft, CalendarClock, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import Link from 'next/link';

const BUSY_STATUSES = ['ASSIGNED', 'ACCEPTED', 'TRAVELLING', 'REACHED_LOCATION', 'IN_PROGRESS', 'PENDING'];

interface SkillMatch { matchedSkillCount: number; matchedSkillNames: string[]; fullMatch: boolean }

function TechnicianPicker({ techs, busyIds, value, onChange, skillMatches, requiredSkillCount }: {
  techs: Technician[];
  busyIds: Set<string>;
  value: string;
  onChange: (id: string) => void;
  skillMatches: Map<string, SkillMatch>;
  requiredSkillCount: number;
}) {
  // Skill-matched technicians float to the top of each availability group so the best fit
  // for this ticket's service is the first thing a manager sees.
  const byMatchThenName = (a: Technician, b: Technician) => {
    const ma = skillMatches.get(a.id)?.matchedSkillCount ?? 0;
    const mb = skillMatches.get(b.id)?.matchedSkillCount ?? 0;
    if (ma !== mb) return mb - ma;
    return a.name.localeCompare(b.name);
  };

  const available = techs.filter(t => t.isActive && !busyIds.has(t.id)).sort(byMatchThenName);
  const busy = techs.filter(t => t.isActive && busyIds.has(t.id)).sort(byMatchThenName);

  if (techs.length === 0) return <p className="text-sm text-[var(--color-text-muted)] py-2">No active technicians found.</p>;

  const renderTech = (tech: Technician, dotColor: string, statusLabel: string, statusClass: string) => {
    const match = skillMatches.get(tech.id);
    return (
      <button key={tech.id} type="button" onClick={() => onChange(tech.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${value === tech.id ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-[var(--color-border)] hover:border-gray-300 hover:bg-gray-50 text-[var(--color-text-secondary)]'}`}>
        <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0`} />
        <span className="flex-1 text-left min-w-0">
          <span className="font-medium block truncate">{tech.name}</span>
          {match && (
            <span className={`text-[10px] block truncate ${match.fullMatch ? 'text-emerald-600' : 'text-amber-600'}`} title={match.matchedSkillNames.join(', ')}>
              {match.fullMatch ? '★ Skill match' : `${match.matchedSkillCount}/${requiredSkillCount} skills matched`} — {match.matchedSkillNames.join(', ')}
            </span>
          )}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}>{statusLabel}</span>
      </button>
    );
  };

  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
      {available.length > 0 && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] px-1 pt-1">
          Available ({available.length})
        </p>
      )}
      {available.map(tech => renderTech(tech, 'bg-emerald-500', 'Available', 'bg-emerald-100 text-emerald-700'))}
      {busy.length > 0 && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] px-1 pt-2">
          On Job ({busy.length})
        </p>
      )}
      {busy.map(tech => renderTech(tech, 'bg-amber-400', 'On Job', 'bg-amber-100 text-amber-700'))}
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const ticketsBase = pathname.startsWith('/admin/') ? '/admin/tickets' : '/manager/tickets';
  const qc = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'reassign' | 'reschedule'>('assign');

  const { data: ticket, isLoading } = useQuery<Ticket>({ queryKey: ['ticket', id], queryFn: async () => (await api.get(`/web/manager/tickets/${id}`)).data.data });
  const { data: techs = [] } = useQuery<Technician[]>({ queryKey: ['technicians'], queryFn: async () => (await api.get('/web/manager/technicians')).data.data });

  const { data: allTickets = [] } = useQuery<Ticket[]>({
    queryKey: ['tickets-availability'],
    queryFn: async () => (await api.get('/web/manager/tickets')).data.data,
    enabled: showAssign,
    staleTime: 60_000,
  });

  // Which technicians match this ticket's service — surfaced in the picker so the manager
  // can prefer a skilled technician over an arbitrary available one.
  const subCategoryId = ticket?.subCategory?.id;
  const { data: recommended } = useQuery<{
    requiredSkills: { id: string; name: string }[];
    matchedTechnicians: { technicianId: string; matchedSkillCount: number; matchedSkillNames: string[]; fullMatch: boolean }[];
  }>({
    queryKey: ['sub-category-recommended-technicians', subCategoryId],
    queryFn: async () => (await api.get(`/web/manager/service-sub-categories/${subCategoryId}/recommended-technicians`)).data.data,
    enabled: showAssign && !!subCategoryId,
  });
  const skillMatches = useMemo(() => {
    const map = new Map<string, SkillMatch>();
    for (const m of recommended?.matchedTechnicians ?? []) {
      map.set(m.technicianId, { matchedSkillCount: m.matchedSkillCount, matchedSkillNames: m.matchedSkillNames, fullMatch: m.fullMatch });
    }
    return map;
  }, [recommended]);
  const requiredSkillCount = recommended?.requiredSkills.length ?? 0;

  const busyTechIds = useMemo(() => new Set(
    allTickets
      .filter(t => BUSY_STATUSES.includes(t.status) && t.technician?.id)
      .map(t => t.technician!.id)
  ), [allTickets]);

  const { register: ra, handleSubmit: ha, reset: resetA, setValue: setAssignValue, watch: watchAssign, formState: { isSubmitting: sa } } = useForm<{ technicianId: string; scheduledAt: string }>();
  const selectedTechId = watchAssign('technicianId') ?? '';
  const selectedSchedule = watchAssign('scheduledAt') ?? '';
  const { register: rc, handleSubmit: hc, reset: resetC, formState: { isSubmitting: sc } } = useForm<{ notes: string }>();
  const { register: rx, handleSubmit: hx, reset: resetX, formState: { isSubmitting: sx } } = useForm<{ reason: string }>();

  const assignMutation = useMutation({
    mutationFn: (d: { technicianId: string; scheduledAt: string }) => api.patch(`/web/manager/tickets/${id}/${assignMode === 'reschedule' ? 'reassign' : assignMode}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success(assignMode === 'reassign' ? 'Reassigned' : assignMode === 'reschedule' ? 'Rescheduled' : 'Assigned');
      setShowAssign(false); resetA();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const closeMutation = useMutation({
    mutationFn: (d: { notes: string }) => api.patch(`/web/manager/tickets/${id}/close`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Ticket closed'); setShowClose(false); resetC(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const cancelMutation = useMutation({
    mutationFn: (d: { reason: string }) => api.patch(`/web/manager/tickets/${id}/cancel`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Ticket cancelled'); setShowCancel(false); resetX(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const approvePendingMutation = useMutation({
    mutationFn: () => api.patch(`/web/manager/tickets/${id}/approve-pending`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Pending approved — technician notified'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  const rejectPendingMutation = useMutation({
    mutationFn: () => api.patch(`/web/manager/tickets/${id}/reject-pending`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); toast.success('Pending rejected — ticket resumed'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed'),
  });

  if (isLoading || !ticket) return <PageSpinner />;

  const canAssign = ticket.status === 'NEW_TICKET';
  const canReassign = ticket.status === 'ASSIGNED' || ticket.status === 'ACCEPTED';
  const canReschedule = ticket.status === 'PENDING';
  const canActOnPending = ticket.status === 'PENDING';
  const canClose = ticket.status === 'INVOICE_GENERATED';
  const canCancel = !['COMPLETED', 'TICKET_CLOSED', 'CANCELLED'].includes(ticket.status);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back link */}
      <Link
        href={ticketsBase}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
      >
        <ChevronLeft size={14} />
        Back to Tickets
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-[var(--color-text-muted)] font-mono">{ticket.ticketNumber}</p>
            {!!ticket.assignmentCount && ticket.assignmentCount > 1 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
                Reassigned {ticket.assignmentCount} times
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mt-0.5">{ticket.customer?.name}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{ticket.customer?.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TicketStatusBadge status={ticket.status} />
          <div className="flex gap-2">
            {canAssign && <Button size="sm" onClick={() => { setAssignMode('assign'); setShowAssign(true); }}><UserCheck size={13} /> Assign</Button>}
            {canReassign && <Button size="sm" variant="secondary" onClick={() => { setAssignMode('reassign'); setShowAssign(true); }}><RefreshCw size={13} /> Reassign</Button>}
            {canReschedule && <Button size="sm" variant="secondary" onClick={() => { setAssignMode('reschedule'); setShowAssign(true); }}><CalendarClock size={13} /> Reschedule</Button>}
            {canActOnPending && (
              <>
                <Button size="sm" variant="secondary" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" loading={approvePendingMutation.isPending} onClick={() => approvePendingMutation.mutate()}><ThumbsUp size={13} /> Approve</Button>
                <Button size="sm" variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50" loading={rejectPendingMutation.isPending} onClick={() => rejectPendingMutation.mutate()}><ThumbsDown size={13} /> Reject</Button>
              </>
            )}
            {canClose && <Button size="sm" variant="secondary" onClick={() => setShowClose(true)}><CheckCircle size={13} /> Close</Button>}
            {canCancel && <Button size="sm" variant="danger" onClick={() => setShowCancel(true)}><XCircle size={13} /> Cancel</Button>}
          </div>
        </div>
      </div>

      {canActOnPending && ticket.pendingReason && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Technician marked this ticket as Pending</p>
            <p className="text-amber-700 mt-0.5"><span className="font-medium">Reason:</span> {ticket.pendingReason}</p>
            {ticket.pendingNotes && <p className="text-amber-700"><span className="font-medium">Notes:</span> {ticket.pendingNotes}</p>}
            <p className="text-amber-600 text-xs mt-1">Use <strong>Approve</strong> to acknowledge the delay, or <strong>Reject</strong> to send the technician back to work immediately.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm text-sm space-y-2">
          <h3 className="font-medium text-[var(--color-text-secondary)]">Details</h3>
          <div className="text-[var(--color-text-secondary)] space-y-1">
            <p><span className="text-[var(--color-text-muted)]">Category:</span> {ticket.subCategory?.category?.name ?? '—'}</p>
            <p><span className="text-[var(--color-text-muted)]">Sub Category:</span> {ticket.subCategory?.name ?? '—'}</p>
            <p><span className="text-[var(--color-text-muted)]">Technician:</span> {ticket.technician?.name ?? 'Unassigned'}</p>
            <p><span className="text-[var(--color-text-muted)]">Scheduled:</span> {ticket.scheduledAt ? dayjs(ticket.scheduledAt).format('DD MMM YYYY, HH:mm') : '—'}</p>
            {ticket.serviceAddress && <p><span className="text-[var(--color-text-muted)]">Address:</span> {ticket.serviceAddress}</p>}
            {ticket.description && <p><span className="text-[var(--color-text-muted)]">Description:</span> {ticket.description}</p>}
            <p><span className="text-[var(--color-text-muted)]">Created:</span> {dayjs(ticket.createdAt).format('DD MMM YYYY, HH:mm')}</p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm text-sm space-y-2">
          <h3 className="font-medium text-[var(--color-text-secondary)]">Payment</h3>
          {ticket.payment ? (
            <div className="space-y-1 text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2"><PaymentStatusBadge status={ticket.payment.status} /></div>
              <p><span className="text-[var(--color-text-muted)]">Amount:</span> ₹{ticket.payment.amount.toLocaleString()}</p>
              <p><span className="text-[var(--color-text-muted)]">Method:</span> {ticket.payment.method ?? '—'}</p>
            </div>
          ) : <p className="text-[var(--color-text-muted)]">No payment yet</p>}

          {ticket.feedback && (
            <>
              <h3 className="font-medium text-[var(--color-text-secondary)] mt-3">Feedback</h3>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < ticket.feedback!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
                <span className="text-[var(--color-text-muted)] ml-1 text-xs">{ticket.feedback.review}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
        <h3 className="font-medium text-[var(--color-text-secondary)] mb-3">Status Timeline</h3>
        <div className="space-y-3">
          {(ticket.statusLogs ?? []).map((log, i) => (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-[var(--color-border-strong)]'}`} />
                {i < (ticket.statusLogs?.length ?? 0) - 1 && <div className="flex-1 w-px bg-[var(--color-border)] mt-1" />}
              </div>
              <div className="pb-3">
                <TicketStatusBadge status={log.status} />
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{dayjs(log.changedAt).format('DD MMM YYYY, HH:mm')}</p>
                {log.notes && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 whitespace-pre-line">{log.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!!ticket.assignmentHistory?.length && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-3">Assignment History</h3>
          <div className="space-y-3">
            {ticket.assignmentHistory.map((entry, i) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1 ${i === (ticket.assignmentHistory!.length - 1) ? 'bg-blue-500' : 'bg-[var(--color-border-strong)]'}`} />
                  {i < ticket.assignmentHistory!.length - 1 && <div className="flex-1 w-px bg-[var(--color-border)] mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Assigned to <span className="font-medium">{entry.technician.name}</span>
                    {entry.assigner && <span className="text-[var(--color-text-muted)]"> by {entry.assigner.name}</span>}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{dayjs(entry.assignedAt).format('DD MMM YYYY, HH:mm')}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium mt-1 ${
                      entry.status === 'ACCEPTED' || entry.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : entry.status === 'REJECTED' || entry.status === 'EXPIRED'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {entry.status}
                  </span>
                  {entry.reason && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{entry.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ticket.images && ticket.images.some(i => i.type === 'RAISED') && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-3">Customer Photos</h3>
          <div className="grid grid-cols-3 gap-4">
            {ticket.images.filter(i => i.type === 'RAISED').map(img => (
              <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={img.imageUrl} alt="Customer upload" className="rounded-lg w-full object-cover aspect-video border border-[var(--color-border)] hover:opacity-90 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {ticket.images && ticket.images.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-3">Work Photos</h3>
          <div className="grid grid-cols-2 gap-4">
            {(['BEFORE', 'AFTER'] as TicketImage['type'][]).map(type => {
              const img = ticket.images!.find(i => i.type === type);
              return (
                <div key={type}>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">{type}</p>
                  {img ? (
                    <a href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img src={img.imageUrl} alt={type} className="rounded-lg w-full object-cover aspect-video border border-[var(--color-border)] hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <div className="rounded-lg bg-[var(--color-surface-elevated)] border border-dashed border-[var(--color-border)] aspect-video flex items-center justify-center">
                      <p className="text-xs text-[var(--color-text-muted)]">No photo</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {ticket.images.find(i => i.type === 'SIGNATURE') && (
            <div className="mt-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Customer Signature</p>
              <a href={ticket.images.find(i => i.type === 'SIGNATURE')!.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={ticket.images.find(i => i.type === 'SIGNATURE')!.imageUrl} alt="Signature" className="rounded-lg h-20 border border-[var(--color-border)] hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}
        </div>
      )}

      <Modal open={showAssign} onClose={() => { setShowAssign(false); resetA(); }} title={assignMode === 'reassign' ? 'Reassign Ticket' : assignMode === 'reschedule' ? 'Reschedule Ticket' : 'Assign Ticket'} size="sm">
        <form onSubmit={ha(d => assignMutation.mutate(d))} className="space-y-4">
          <Input
            label="Scheduled At"
            type="datetime-local"
            {...ra('scheduledAt', { required: 'Pick a date & time first' })}
          />

          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-2">Technician</label>
            {!selectedSchedule ? (
              <p className="text-sm text-[var(--color-text-muted)] py-2 px-3 rounded-lg bg-[var(--color-surface-elevated)]">
                Pick a scheduled date &amp; time above to choose a technician.
              </p>
            ) : (
              <>
                {subCategoryId && requiredSkillCount === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">
                    No skills are mapped to this service yet — set them from the Categories page to get skill-based suggestions here.
                  </p>
                )}
                <TechnicianPicker
                  techs={techs.filter(t => t.isActive)}
                  busyIds={busyTechIds}
                  value={selectedTechId}
                  onChange={id => setAssignValue('technicianId', id, { shouldValidate: true })}
                  skillMatches={skillMatches}
                  requiredSkillCount={requiredSkillCount}
                />
                {!selectedTechId && <p className="text-red-400 text-xs mt-1.5">Please select a technician</p>}
              </>
            )}
            <input type="hidden" {...ra('technicianId', { required: true })} />
          </div>

          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setShowAssign(false); resetA(); }}>Cancel</Button><Button type="submit" loading={sa}>{assignMode === 'reassign' ? 'Reassign' : assignMode === 'reschedule' ? 'Reschedule' : 'Assign'}</Button></div>
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
