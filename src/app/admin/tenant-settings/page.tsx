'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { TenantSettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { PageSpinner } from '@/components/ui/Spinner';

export default function TenantSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<TenantSettings>({
    queryKey: ['tenant-settings'],
    queryFn: async () => (await api.get('/web/admin/tenant-settings')).data.data,
  });

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<Omit<TenantSettings, 'id' | 'upiQrImageUrl'>>();

  useEffect(() => {
    if (data) reset({
      gstEnabled: data.gstEnabled,
      gstPercent: data.gstPercent,
      invoicePrefix: data.invoicePrefix,
      invoiceNumberFormat: data.invoiceNumberFormat,
      upiId: data.upiId,
      upiAccountName: data.upiAccountName,
    });
  }, [data, reset]);

  const gstEnabled = watch('gstEnabled');

  const updateMutation = useMutation({
    mutationFn: (d: Omit<TenantSettings, 'id' | 'upiQrImageUrl'>) => api.patch('/web/admin/tenant-settings', {
      gstEnabled: d.gstEnabled,
      gstPercent: d.gstPercent,
      invoicePrefix: d.invoicePrefix,
      invoiceNumberFormat: d.invoiceNumberFormat,
      upiId: d.upiId,
      upiAccountName: d.upiAccountName,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-settings'] }); toast.success('Settings saved'); },
    onError: () => toast.error('Failed'),
  });

  const upiQrMutation = useMutation({
    mutationFn: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/web/admin/tenant-settings/upi-qr', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-settings'] }); toast.success('QR image updated'); },
    onError: () => toast.error('Upload failed'),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Tenant Settings</h2>
      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm space-y-6">
        <div>
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">GST Settings</h3>
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" id="gstEnabled" {...register('gstEnabled')} className="h-4 w-4" />
            <label htmlFor="gstEnabled" className="text-sm text-[var(--color-text-secondary)]">Enable GST</label>
          </div>
          {gstEnabled && <Input label="GST %" type="number" step="0.01" {...register('gstPercent', { valueAsNumber: true })} className="w-40" />}
        </div>

        <div>
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Invoice Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Prefix" placeholder="INV-" {...register('invoicePrefix')} />
            <Input label="Number Format" placeholder="0001" {...register('invoiceNumberFormat')} />
          </div>
        </div>

        <div>
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">UPI Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="UPI ID" placeholder="name@upi" {...register('upiId')} />
            <Input label="UPI Account Name" {...register('upiAccountName')} />
            <div className="col-span-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">UPI QR Image</p>
              <FileUpload onFile={file => upiQrMutation.mutate(file)} loading={upiQrMutation.isPending} preview={data?.upiQrImageUrl} />
              {data?.upiQrImageUrl && <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{data.upiQrImageUrl}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
