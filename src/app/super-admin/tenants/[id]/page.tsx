'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/lib/axios';
import { Tenant, TenantStatus, Plan, Billing } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge, TenantStatusBadge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import dayjs from 'dayjs';
import { Users, CreditCard, Calendar, Download, QrCode } from 'lucide-react';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showQr, setShowQr] = useState(false);

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => (await api.get(`/web/super-admin/tenants/${id}`)).data.data,
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/web/super-admin/plans')).data.data,
  });

  const { data: billings = [] } = useQuery<Billing[]>({
    queryKey: ['tenant-billings', id],
    queryFn: async () => {
      const res = await api.get(`/web/super-admin/billing`, { params: { tenantId: id } });
      const d = res.data.data;
      return Array.isArray(d) ? d : (d?.billings ?? d?.items ?? []);
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<Tenant>>();

  useEffect(() => {
    if (tenant) reset({ companyName: tenant.companyName, email: tenant.email, phone: tenant.phone, address: tenant.address });
  }, [tenant, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tenant>) => api.patch(`/web/super-admin/tenants/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Tenant updated'); },
    onError: () => toast.error('Update failed'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TenantStatus) => api.patch(`/web/super-admin/tenants/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant', id] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed'),
  });

  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => api.patch(`/web/super-admin/tenants/${id}/plan`, { planId }),
    onSuccess: (_, planId) => {
      qc.invalidateQueries({ queryKey: ['tenant', id] });
      const planName = plans.find(p => p.id === planId)?.name ?? 'plan';
      toast.success(`Plan changed to ${planName}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to change plan'),
  });

  const billingColumns: ColumnDef<Billing, unknown>[] = [
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${row.original.amount.toLocaleString()}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'PAID' ? 'success' : 'warning'}>{row.original.status}</Badge> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dayjs(row.original.createdAt).format('DD MMM YYYY') },
    { accessorKey: 'paidAt', header: 'Paid At', cell: ({ row }) => row.original.paidAt ? dayjs(row.original.paidAt).format('DD MMM YYYY') : '—' },
  ];

  if (isLoading || !tenant) return <PageSpinner />;

  const planOptions = plans.map(p => ({ value: p.id, label: `${p.name} — ₹${p.price}` }));
  const currentPlan = tenant.subscription?.plan ?? tenant.selectedPlan ?? null;
  const currentPlanId = tenant.subscription?.planId ?? tenant.selectedPlanId ?? '';

  // UPI QR string — standard UPI deep link
  const upiQrString = currentPlan
    ? `upi://pay?pa=fieldeaze@upi&pn=FieldEaze&am=${currentPlan.price}&tn=${tenant.tenantCode}-subscription&cu=INR`
    : '';

  function downloadQr() {
    const canvas = document.querySelector('#tenant-qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${tenant!.tenantCode}-payment-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{tenant.companyName}</h2>
          <p className="text-sm text-gray-400">{tenant.tenantCode}</p>
        </div>
        <TenantStatusBadge status={tenant.status} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Current Plan</p>
            <p className="text-sm font-semibold text-gray-800">
              {currentPlan?.name ?? '—'}
              {!tenant.subscription && tenant.selectedPlan && (
                <span className="ml-1.5 text-xs font-normal text-amber-500">(trial)</span>
              )}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Calendar size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Subscription End</p>
            <p className="text-sm font-semibold text-gray-800">
              {tenant.subscription?.endDate ? dayjs(tenant.subscription.endDate).format('DD MMM YYYY') : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <Users size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Billing Records</p>
            <p className="text-sm font-semibold text-gray-800">{billings.length}</p>
          </div>
        </div>
      </div>

      {/* Edit Details */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Edit Details</h3>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Input label="Company Name" {...register('companyName')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Address" {...register('address')} />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Change Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Change Status</h3>
        <div className="flex gap-3">
          {(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'TRIAL'] as TenantStatus[]).map(s => (
            <Button
              key={s}
              variant={tenant.status === s ? 'primary' : 'outline'}
              size="sm"
              onClick={() => statusMutation.mutate(s)}
              loading={statusMutation.isPending}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Change Plan — works for TRIAL and ACTIVE */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Change Plan</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <Select
            label="Select Plan"
            options={planOptions}
            value={currentPlanId}
            onChange={e => changePlanMutation.mutate(e.target.value)}
            className="w-64"
          />
          {changePlanMutation.isPending && <p className="text-xs text-gray-400 pb-2">Updating…</p>}
        </div>
        {!tenant.subscription && (
          <p className="mt-2 text-xs text-amber-600">
            This tenant is on a trial. Changing the plan updates what they will pay when they subscribe.
          </p>
        )}
      </div>

      {/* Generate Payment QR */}
      {currentPlan && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <QrCode size={16} className="text-violet-500" /> Payment QR
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowQr(v => !v)}>
                {showQr ? 'Hide QR' : 'Generate QR'}
              </Button>
              {showQr && (
                <Button size="sm" variant="secondary" onClick={downloadQr}>
                  <Download size={13} /> Download
                </Button>
              )}
            </div>
          </div>

          {showQr && (
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2">
                <QRCodeCanvas
                  id="tenant-qr-canvas"
                  value={upiQrString}
                  size={160}
                  level="M"
                  marginSize={2}
                />
                <p className="text-xs text-gray-400">Scan to pay via UPI</p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Plan</p>
                  <p className="font-semibold text-gray-800">{currentPlan.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="text-xl font-bold text-gray-800">₹{Number(currentPlan.price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tenant</p>
                  <p className="font-medium text-gray-700">{tenant.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">UPI String</p>
                  <p className="font-mono text-xs text-gray-500 break-all max-w-xs">{upiQrString}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription Info */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-3">Subscription Info</h3>
        {tenant.subscription ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Plan:</span> <span className="font-medium">{tenant.subscription.plan?.name}</span></div>
            <div><span className="text-gray-500">Start:</span> <span className="font-medium">{dayjs(tenant.subscription.startDate).format('DD MMM YYYY')}</span></div>
            <div><span className="text-gray-500">End:</span> <span className="font-medium">{dayjs(tenant.subscription.endDate).format('DD MMM YYYY')}</span></div>
            <div><span className="text-gray-500">Active:</span> <span className="font-medium">{tenant.subscription.isActive ? 'Yes' : 'No'}</span></div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No active subscription — on trial until {tenant.trialEndsAt ? dayjs(tenant.trialEndsAt).format('DD MMM YYYY') : '—'}</p>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Billing History</h3>
        {billings.length === 0 ? (
          <p className="text-sm text-gray-400">No billing records found.</p>
        ) : (
          <DataTable data={billings} columns={billingColumns} isLoading={false} />
        )}
      </div>
    </div>
  );
}
