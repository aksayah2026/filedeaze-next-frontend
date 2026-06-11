'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { TenantSettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

export default function TenantSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<TenantSettings>({
    queryKey: ['tenant-settings'],
    queryFn: async () => (await api.get('/web/admin/tenant-settings')).data.data,
  });

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<Omit<TenantSettings, 'id'>>();

  useEffect(() => { if (data) reset(data); }, [data, reset]);

  const gstEnabled = watch('gstEnabled');

  const updateMutation = useMutation({
    mutationFn: (d: Omit<TenantSettings, 'id'>) => api.patch('/web/admin/tenant-settings', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-settings'] }); toast.success('Settings saved'); },
    onError: () => toast.error('Failed'),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Tenant Settings</h2>
      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-medium text-gray-700 mb-4">GST Settings</h3>
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" id="gstEnabled" {...register('gstEnabled')} className="h-4 w-4" />
            <label htmlFor="gstEnabled" className="text-sm text-gray-700">Enable GST</label>
          </div>
          {gstEnabled && <Input label="GST %" type="number" step="0.01" {...register('gstPercent', { valueAsNumber: true })} className="w-40" />}
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-4">Invoice Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Prefix" placeholder="INV-" {...register('invoicePrefix')} />
            <Input label="Number Format" placeholder="0001" {...register('invoiceNumberFormat')} />
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-4">UPI Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="UPI ID" placeholder="name@upi" {...register('upiId')} />
            <Input label="UPI Account Name" {...register('upiAccountName')} />
            <Input label="UPI QR Image URL" {...register('upiQrImageUrl')} className="col-span-2" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
