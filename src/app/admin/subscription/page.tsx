'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { MySubscription } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, QrCode, CreditCard, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function SubscriptionPage() {
  const { data, isLoading } = useQuery<MySubscription>({
    queryKey: ['my-subscription'],
    queryFn: async () => (await api.get('/web/admin/subscription')).data.data,
  });

  if (isLoading) return <PageSpinner />;

  const { subscription, pendingBill, billingHistory, paymentInfo } = data ?? {};
  const plan = subscription?.plan;
  const daysLeft = subscription ? dayjs(subscription.endDate).diff(dayjs(), 'day') : 0;
  const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
  const isExpired = daysLeft < 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-800">Subscription & Billing</h2>

      {/* Current Plan */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-blue-500" /> Current Plan
        </h3>
        {plan ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-800">{plan.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">₹{Number(plan.price).toLocaleString()} / year</p>
              <div className="mt-3 flex items-center gap-2">
                {isExpired ? (
                  <Badge variant="danger">Expired</Badge>
                ) : isExpiringSoon ? (
                  <Badge variant="warning">Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {dayjs(subscription!.startDate).format('DD MMM YYYY')} → {dayjs(subscription!.endDate).format('DD MMM YYYY')}
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{plan.managerLimit}</strong> managers</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{plan.technicianLimit}</strong> technicians</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{plan.ticketLimit}</strong> tickets / month</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> <strong>{plan.storageLimitGb} GB</strong> storage</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No active subscription. Contact support to get started.</p>
        )}
      </div>

      {/* Pending Payment */}
      {pendingBill && (
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Payment Pending</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Please pay <strong>₹{Number(pendingBill.amount).toLocaleString()}</strong> to activate / continue your subscription.
              </p>
            </div>
          </div>

          {paymentInfo?.upiId || paymentInfo?.upiQrImageUrl ? (
            <div className="bg-white rounded-lg p-4 border border-amber-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {paymentInfo.upiQrImageUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={paymentInfo.upiQrImageUrl}
                    alt="UPI QR Code"
                    className="h-40 w-40 rounded-lg border border-gray-200 object-contain"
                  />
                  <p className="text-xs text-gray-400">Scan to pay</p>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <QrCode size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">UPI ID</p>
                    <p className="font-mono font-medium text-gray-800 select-all">{paymentInfo.upiId}</p>
                  </div>
                </div>
                {paymentInfo.upiAccountName && (
                  <div className="text-sm">
                    <p className="text-xs text-gray-400">Account Name</p>
                    <p className="font-medium text-gray-800">{paymentInfo.upiAccountName}</p>
                  </div>
                )}
                <div className="text-sm">
                  <p className="text-xs text-gray-400">Amount to Pay</p>
                  <p className="text-lg font-bold text-gray-800">₹{Number(pendingBill.amount).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                  After payment, share the UTR / transaction ID with support. Your billing will be marked as paid once confirmed.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-amber-100 text-sm text-gray-500">
              Payment details not configured yet. Please contact support to get payment instructions.
            </div>
          )}
        </div>
      )}

      {/* Billing History */}
      {billingHistory && billingHistory.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" /> Billing History
          </h3>
          <div className="space-y-2">
            {billingHistory.map(bill => (
              <div key={bill.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">₹{Number(bill.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{dayjs(bill.createdAt).format('DD MMM YYYY')}</p>
                </div>
                <div className="text-right">
                  <Badge variant={bill.status === 'PAID' ? 'success' : 'warning'}>{bill.status}</Badge>
                  {bill.paidAt && <p className="text-xs text-gray-400 mt-1">Paid {dayjs(bill.paidAt).format('DD MMM YYYY')}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
