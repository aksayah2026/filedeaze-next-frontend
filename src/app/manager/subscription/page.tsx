'use client';

// Managers land here when their tenant is EXPIRED or PAYMENT_PENDING.
// They can view subscription status but cannot submit payment proof (admin-only action).
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Plan } from '@/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, CreditCard, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

interface SubscriptionInfo {
  tenantStatus: string;
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  currentPlan: Plan | null;
  subscription: { startDate: string; endDate: string } | null;
  latestPaymentRequest: { status: string; submittedAt: string } | null;
}

export default function ManagerSubscriptionPage() {
  const { data, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['my-subscription'],
    queryFn: async () => (await api.get('/web/subscription/info')).data.data,
  });

  if (isLoading) return <PageSpinner />;

  const { tenantStatus, trialDaysLeft, currentPlan, subscription, latestPaymentRequest } = data ?? {};
  const isTrial = tenantStatus === 'TRIAL';
  const isExpired = tenantStatus === 'EXPIRED';
  const isPaymentPending = tenantStatus === 'PAYMENT_PENDING';

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800">Subscription Status</h2>

      {/* Status banner */}
      {(isExpired || isPaymentPending || isTrial) && (
        <div className={`rounded-xl p-5 border flex items-start gap-3 ${
          isExpired ? 'bg-red-50 border-red-200' :
          isPaymentPending ? 'bg-blue-50 border-blue-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <AlertCircle size={18} className={`mt-0.5 shrink-0 ${isExpired ? 'text-red-500' : isPaymentPending ? 'text-blue-500' : 'text-amber-500'}`} />
          <div>
            <p className={`font-medium ${isExpired ? 'text-red-800' : isPaymentPending ? 'text-blue-800' : 'text-amber-800'}`}>
              {isExpired && 'Subscription Expired'}
              {isPaymentPending && 'Payment Under Review'}
              {isTrial && `Free Trial${trialDaysLeft != null && trialDaysLeft > 0 ? ` — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left` : ' Expired'}`}
            </p>
            <p className={`text-sm mt-1 ${isExpired ? 'text-red-700' : isPaymentPending ? 'text-blue-700' : 'text-amber-700'}`}>
              {isExpired && 'Your subscription has expired. Please contact your administrator to renew.'}
              {isPaymentPending && 'Your administrator has submitted payment proof. Awaiting Super Admin approval.'}
              {isTrial && 'Contact your administrator to subscribe and continue using the platform.'}
            </p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-blue-500" /> Current Plan
        </h3>
        {currentPlan ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-800">{currentPlan.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">₹{Number(currentPlan.price).toLocaleString()} / year</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {isTrial && <Badge variant="warning">Trial</Badge>}
                {isExpired && <Badge variant="danger">Expired</Badge>}
                {isPaymentPending && <Badge variant="warning">Payment Pending</Badge>}
                {tenantStatus === 'ACTIVE' && <Badge variant="success">Active</Badge>}
              </div>
              {subscription && (
                <p className="text-xs text-gray-400 mt-2">
                  {dayjs(subscription.startDate).format('DD MMM YYYY')} → {dayjs(subscription.endDate).format('DD MMM YYYY')}
                </p>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{currentPlan.managerLimit}</strong> managers</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{currentPlan.technicianLimit}</strong> technicians</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Up to <strong>{currentPlan.ticketLimit}</strong> tickets / month</div>
              <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> <strong>{currentPlan.storageLimitGb} GB</strong> storage</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No plan assigned. Please contact your administrator.</p>
        )}
      </div>

      {/* Payment request status */}
      {isPaymentPending && latestPaymentRequest && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Payment Request
          </h3>
          <div className="flex items-center gap-3">
            <Badge variant="warning">{latestPaymentRequest.status.replace('_', ' ')}</Badge>
            <p className="text-sm text-gray-500">Submitted {dayjs(latestPaymentRequest.submittedAt).format('DD MMM YYYY, h:mm A')}</p>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Your payment proof is under review. You will be notified once it is approved.
            To re-submit or manage your subscription, please contact your administrator.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        To manage your subscription, please contact your workspace administrator.
      </p>
    </div>
  );
}
