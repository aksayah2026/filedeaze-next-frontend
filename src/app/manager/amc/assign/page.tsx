'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';
import { Customer, CustomerAsset, AmcPlan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type AssignForm = {
  customerId: string;
  customerAssetId: string;
  planId: string;
  startDate: string;
};

export default function AssignAmcPage() {
  const pathname = usePathname();
  const prefix = pathname.startsWith('/admin/') ? 'admin' : 'manager';
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<AssignForm>({
    defaultValues: { customerId: searchParams.get('customerId') ?? '', customerAssetId: '', planId: '', startDate: '' },
  });
  const customerId = watch('customerId');

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/web/manager/customers')).data.data,
  });

  const { data: assets = [] } = useQuery<CustomerAsset[]>({
    queryKey: ['customer-assets-for-customer', customerId],
    queryFn: async () => (await api.get('/web/manager/customer-assets', { params: { customerId } })).data.data,
    enabled: !!customerId,
  });

  const { data: plans = [] } = useQuery<AmcPlan[]>({
    queryKey: ['amc-plans-active'],
    queryFn: async () => (await api.get('/web/manager/amc/plans', { params: { isActive: true } })).data.data,
  });

  useEffect(() => {
    const assetId = searchParams.get('assetId');
    if (assetId && assets.some(a => a.id === assetId)) {
      setValue('customerAssetId', assetId, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const assignMutation = useMutation({
    mutationFn: (d: AssignForm) => api.post('/web/manager/amc/subscriptions', {
      customerAssetId: d.customerAssetId,
      planId: d.planId,
      startDate: d.startDate || undefined,
    }),
    onSuccess: (res) => {
      toast.success('AMC assigned successfully');
      router.push(`/${prefix}/amc/subscriptions/${res.data.data.id}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err?.response?.data?.message ?? 'Failed to assign AMC'),
  });

  const selectedAsset = assets.find(a => a.id === watch('customerAssetId'));

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Assign AMC</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Attach a maintenance contract to one of a customer's registered assets</p>
      </div>

      <form onSubmit={handleSubmit(d => assignMutation.mutate(d))} className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] shadow-sm space-y-4">
        <Select
          label="Customer *"
          options={customers.map(c => ({ value: c.id, label: `${c.name} — ${c.phone ?? ''}` }))}
          placeholder="Select customer"
          error={errors.customerId?.message}
          {...register('customerId', { required: 'Customer is required' })}
        />

        <Select
          label="Asset *"
          options={assets.map(a => ({ value: a.id, label: `${a.name}${a.brand ? ` (${a.brand})` : ''}` }))}
          placeholder={customerId ? 'Select asset' : 'Select a customer first'}
          error={errors.customerAssetId?.message}
          {...register('customerAssetId', { required: 'Asset is required' })}
        />
        {selectedAsset?.hasActiveAmc && (
          <p className="text-xs text-amber-600 -mt-2">This asset already has an active AMC subscription — assigning a new one will fail until it's cancelled or expires.</p>
        )}

        <Select
          label="AMC Plan *"
          options={plans.map(p => ({ value: p.id, label: `${p.name} — ₹${p.price.toLocaleString()} / ${p.durationMonths}mo / ${p.visitCount} visits` }))}
          placeholder="Select plan"
          error={errors.planId?.message}
          {...register('planId', { required: 'Plan is required' })}
        />

        <Input label="Start Date" type="date" hint="Defaults to today if left blank" {...register('startDate')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" loading={isSubmitting || assignMutation.isPending}>
            <ShieldCheck size={14} /> Assign AMC
          </Button>
        </div>
      </form>
    </div>
  );
}
