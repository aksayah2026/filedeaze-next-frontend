'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react';
import dayjs from 'dayjs';

interface PaymentRequest {
  id: string;
  tenantId: string;
  paymentReference: string;
  amount: number;
  screenshotUrl?: string;
  transactionReference?: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionNotes?: string;
  tenant: { companyName: string; tenantCode: string };
  plan: { name: string; price: number } | null;
}

const statusVariant = {
  PENDING_REVIEW: 'warning' as const,
  APPROVED: 'success' as const,
  REJECTED: 'danger' as const,
};

export default function PaymentRequestsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('PENDING_REVIEW');
  const [rejectId, setRejectId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery<PaymentRequest[]>({
    queryKey: ['payment-requests', filter],
    queryFn: async () =>
      (await api.get('/web/super-admin/payment-requests', { params: filter ? { status: filter } : {} })).data.data,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/web/super-admin/payment-requests/${id}/approve`),
    onSuccess: () => {
      toast.success('Payment approved — subscription activated.');
      qc.invalidateQueries({ queryKey: ['payment-requests'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Approval failed'),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ rejectionNotes: string }>();

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionNotes }: { id: string; rejectionNotes: string }) =>
      api.patch(`/web/super-admin/payment-requests/${id}/reject`, { rejectionNotes }),
    onSuccess: () => {
      toast.success('Payment request rejected. Tenant can re-submit.');
      setRejectId(null);
      reset();
      qc.invalidateQueries({ queryKey: ['payment-requests'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Rejection failed'),
  });

  const filterOptions = [
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: '', label: 'All' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Payment Requests</h2>
        <div className="flex gap-2">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
          <Clock size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No {filter === 'PENDING_REVIEW' ? 'pending' : ''} payment requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{req.tenant.companyName}</p>
                    <span className="text-xs text-gray-400">({req.tenant.tenantCode})</span>
                    <Badge variant={statusVariant[req.status]}>{req.status.replace(/_/g, ' ')}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Plan</p>
                      <p className="font-medium text-gray-700">{req.plan?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="font-medium text-gray-700">₹{Number(req.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Reference</p>
                      <p className="font-mono text-gray-700 text-xs">{req.paymentReference}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Submitted</p>
                      <p className="font-medium text-gray-700">{dayjs(req.submittedAt).format('DD MMM YYYY, h:mm A')}</p>
                    </div>
                    {req.transactionReference && (
                      <div>
                        <p className="text-xs text-gray-400">UTR / Txn ID</p>
                        <p className="font-mono text-gray-700">{req.transactionReference}</p>
                      </div>
                    )}
                    {req.screenshotUrl && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Screenshot</p>
                        <a
                          href={req.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink size={12} /> View Screenshot
                        </a>
                      </div>
                    )}
                    {(req.approvedAt ?? req.rejectedAt) && (
                      <div>
                        <p className="text-xs text-gray-400">Reviewed</p>
                        <p className="font-medium text-gray-700">{dayjs(req.approvedAt ?? req.rejectedAt).format('DD MMM YYYY')}</p>
                      </div>
                    )}
                    {req.rejectionNotes && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Rejection Reason</p>
                        <p className="text-gray-700">{req.rejectionNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {req.status === 'PENDING_REVIEW' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(req.id)}
                      loading={approveMutation.isPending && approveMutation.variables === req.id}
                    >
                      <CheckCircle size={14} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRejectId(rejectId === req.id ? null : req.id)}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                )}
              </div>

              {rejectId === req.id && (
                <form
                  onSubmit={handleSubmit(d => rejectMutation.mutate({ id: req.id, rejectionNotes: d.rejectionNotes }))}
                  className="mt-4 pt-4 border-t border-gray-100 flex gap-3 items-end"
                >
                  <Input
                    label="Rejection Reason"
                    placeholder="e.g. UTR not matching, screenshot unclear"
                    {...register('rejectionNotes', { required: 'Please provide a reason' })}
                    className="flex-1"
                  />
                  <Button type="submit" variant="danger" size="sm" loading={isSubmitting}>Confirm Reject</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setRejectId(null); reset(); }}>Cancel</Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
