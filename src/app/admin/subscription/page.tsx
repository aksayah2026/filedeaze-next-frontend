'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Plan } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, Clock, QrCode, CreditCard, AlertCircle, Send, FileText } from 'lucide-react';
import dayjs from 'dayjs';

interface SubscriptionInfo {
  tenantStatus: string;
  isTrial: boolean;
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  currentPlan: Plan | null;
  subscription: { id: string; startDate: string; endDate: string; status: string; plan?: Plan } | null;
  pendingBill: { id: string; amount: number; status: string } | null;
  billingHistory: Array<{ id: string; amount: number; status: string; paidAt?: string; createdAt: string }>;
  latestPaymentRequest: {
    id: string;
    paymentReference: string;
    amount: number;
    status: string;
    screenshotUrl?: string;
    transactionReference?: string;
    submittedAt: string;
    plan?: { name: string; price: number };
  } | null;
  paymentInfo: { upiId: string | null; upiAccountName: string | null; upiQrImageUrl: string | null };
}

interface ProofForm {
  transactionReference: string;
}

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['my-subscription'],
    queryFn: async () => (await api.get('/web/subscription/info')).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProofForm>();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/web/subscription/upload-screenshot', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScreenshotUrl(res.data.data.url);
      toast.success('Screenshot uploaded');
    } catch {
      toast.error('Failed to upload screenshot');
      setScreenshotFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const submitProof = useMutation({
    mutationFn: (dto: ProofForm) =>
      api.post('/web/subscription/payment-requests', { ...dto, screenshotUrl }),
    onSuccess: () => {
      toast.success('Payment proof submitted! Awaiting Super Admin review.');
      reset();
      setShowForm(false);
      setScreenshotFile(null);
      setScreenshotUrl('');
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Submission failed');
    },
  });

  if (isLoading) return <PageSpinner />;

  const {
    tenantStatus, isTrial: isTrialFromApi, trialDaysLeft, trialEndsAt, currentPlan,
    subscription, billingHistory, latestPaymentRequest, paymentInfo,
  } = data ?? {};

  const isTrial = isTrialFromApi ?? tenantStatus === 'TRIAL';
  const isExpired = tenantStatus === 'EXPIRED';
  const isPaymentPending = tenantStatus === 'PAYMENT_PENDING';
  const isActive = tenantStatus === 'ACTIVE' && !isTrial;

  const subDaysLeft = subscription ? dayjs(subscription.endDate).diff(dayjs(), 'day') : null;
  const isExpiringSoon = isActive && subDaysLeft !== null && subDaysLeft <= 7 && subDaysLeft >= 0;

  // Allow resubmit if: trial/expired (first-time), or payment_pending after a rejection
  const isRejected = latestPaymentRequest?.status === 'REJECTED';
  const canSubmitProof =
    (isTrial || isExpired || (isPaymentPending && isRejected)) &&
    latestPaymentRequest?.status !== 'PENDING_REVIEW';

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Subscription & Billing</h2>

      {/* Current Plan */}
      <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] shadow-sm">
        <h3 className="font-medium text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-blue-500" /> Current Plan
        </h3>
        {currentPlan ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{currentPlan.name}</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">₹{Number(currentPlan.price).toLocaleString()} / year</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {isTrial && (
                  <Badge variant="warning">
                    {trialDaysLeft != null && trialDaysLeft > 0
                      ? `Trial — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`
                      : 'Trial Expired'}
                  </Badge>
                )}
                {isExpired && <Badge variant="danger">Subscription Expired</Badge>}
                {isPaymentPending && <Badge variant="warning">Payment Under Review</Badge>}
                {isActive && isExpiringSoon && <Badge variant="warning">Expires in {subDaysLeft}d</Badge>}
                {isActive && !isExpiringSoon && subscription && <Badge variant="success">Active</Badge>}
              </div>
              {subscription && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  {dayjs(subscription.startDate).format('DD MMM YYYY')} → {dayjs(subscription.endDate).format('DD MMM YYYY')}
                </p>
              )}
              {isTrial && trialEndsAt && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Trial ends {dayjs(trialEndsAt).format('DD MMM YYYY')}
                </p>
              )}
            </div>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{currentPlan.managerLimit}</strong> managers</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{currentPlan.technicianLimit}</strong> technicians</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{currentPlan.ticketLimit}</strong> tickets / month</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> <strong>{currentPlan.storageLimitGb} GB</strong> storage</div>
            </div>
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] text-sm">No plan assigned. Please contact support.</p>
        )}
      </div>

      {/* Payment Request Status */}
      {isPaymentPending && latestPaymentRequest && (
        <div className="bg-[var(--color-surface-elevated)] rounded-xl p-5 border border-blue-200">
          <div className="flex items-start gap-2">
            <Clock size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Payment Under Review</p>
              <p className="text-sm text-blue-700 mt-1">
                Your payment proof has been submitted and is awaiting Super Admin approval.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-blue-500">Reference</p>
                  <p className="font-mono font-medium text-blue-800">{latestPaymentRequest.paymentReference}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Amount</p>
                  <p className="font-medium text-blue-800">₹{Number(latestPaymentRequest.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Submitted</p>
                  <p className="font-medium text-blue-800">{dayjs(latestPaymentRequest.submittedAt).format('DD MMM YYYY, h:mm A')}</p>
                </div>
                {latestPaymentRequest.transactionReference && (
                  <div>
                    <p className="text-xs text-blue-500">UTR / Txn ID</p>
                    <p className="font-mono font-medium text-blue-800">{latestPaymentRequest.transactionReference}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI Payment Info */}
      {(isTrial || isExpired || (isPaymentPending && isRejected)) && (
        <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
            <QrCode size={16} className="text-blue-500" /> Pay to Activate
          </h3>

          {paymentInfo?.upiId ? (() => {
            const upiString = `upi://pay?pa=${paymentInfo.upiId}&pn=${encodeURIComponent(paymentInfo.upiAccountName ?? 'FieldEaze')}&am=${currentPlan?.price ?? ''}&tn=subscription&cu=INR`;
            return (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {paymentInfo.upiQrImageUrl ? (
                    <img src={paymentInfo.upiQrImageUrl} alt="UPI QR" className="h-40 w-40 rounded-lg border object-contain" />
                  ) : (
                    <QRCodeCanvas value={upiString} size={160} level="M" marginSize={2} />
                  )}
                  <p className="text-xs text-[var(--color-text-muted)]">Scan to pay via UPI</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">UPI ID</p>
                    <p className="font-mono font-medium text-[var(--color-text-primary)] select-all">{paymentInfo.upiId}</p>
                  </div>
                  {paymentInfo.upiAccountName && (
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Account Name</p>
                      <p className="font-medium text-[var(--color-text-primary)]">{paymentInfo.upiAccountName}</p>
                    </div>
                  )}
                  {currentPlan && (
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Amount to Pay</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">₹{Number(currentPlan.price).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <p className="text-sm text-[var(--color-text-muted)]">UPI payment details not configured yet. You can still submit your proof below once you have paid through a shared payment link or bank transfer.</p>
          )}
        </div>
      )}

      {/* Submit Payment Proof */}
      {canSubmitProof && (
        <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
              <Send size={16} className="text-green-500" /> Submit Payment Proof
            </h3>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>Submit Proof</Button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit(d => submitProof.mutate(d))} className="space-y-4">
              <div className="bg-[var(--color-surface-elevated)] border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                <AlertCircle size={14} className="inline mr-1.5" />
                After paying via UPI, upload your payment screenshot and enter the UTR number below.
              </div>

              {/* Screenshot file picker */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Payment Screenshot</label>
                <div
                  className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {uploading ? (
                    <p className="text-sm text-[var(--color-text-muted)]">Uploading…</p>
                  ) : screenshotFile ? (
                    <div className="flex items-center gap-3 w-full">
                      <img
                        src={screenshotUrl}
                        alt="preview"
                        className="h-12 w-12 rounded object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-secondary)] truncate">{screenshotFile.name}</p>
                        <p className="text-xs text-green-600">Uploaded successfully</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={e => { e.stopPropagation(); setScreenshotFile(null); setScreenshotUrl(''); }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">Click to upload screenshot (JPG, PNG, WebP)</p>
                  )}
                </div>
                {!screenshotFile && !uploading && (
                  <p className="text-xs text-red-500 hidden" id="screenshot-error" />
                )}
              </div>

              <Input
                label="UTR / Transaction Reference Number"
                placeholder="e.g. 424242424242"
                {...register('transactionReference', { required: 'Transaction reference is required' })}
                error={errors.transactionReference?.message}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={isSubmitting || uploading}
                  disabled={!screenshotUrl}
                >
                  Submit for Review
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); reset(); setScreenshotFile(null); setScreenshotUrl(''); }}
                >
                  Cancel
                </Button>
              </div>
              {!screenshotUrl && !uploading && screenshotFile === null && isSubmitting && (
                <p className="text-xs text-red-500">Please upload a payment screenshot.</p>
              )}
            </form>
          )}

          {latestPaymentRequest?.status === 'REJECTED' && (
            <div className="mt-3 bg-[var(--color-surface-elevated)] border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              Your previous payment request was rejected. Please re-submit with correct details.
            </div>
          )}
        </div>
      )}

      {/* Billing History */}
      {billingHistory && billingHistory.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[var(--color-text-muted)]" /> Billing History
          </h3>
          <div className="space-y-2">
            {billingHistory.map(bill => (
              <div key={bill.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">₹{Number(bill.amount).toLocaleString()}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{dayjs(bill.createdAt).format('DD MMM YYYY')}</p>
                </div>
                <div className="text-right">
                  <Badge variant={bill.status === 'PAID' ? 'success' : 'warning'}>{bill.status}</Badge>
                  {bill.paidAt && <p className="text-xs text-[var(--color-text-muted)] mt-1">Paid {dayjs(bill.paidAt).format('DD MMM YYYY')}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
