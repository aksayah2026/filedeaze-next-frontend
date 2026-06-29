'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { CompanySettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { PageSpinner } from '@/components/ui/Spinner';

export default function CompanySettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<CompanySettings>({
    queryKey: ['company-settings'],
    queryFn: async () => (await api.get('/web/admin/company-settings')).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Omit<CompanySettings, 'id' | 'logoUrl' | 'email'>>();

  useEffect(() => {
    if (data) reset({
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    });
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (d: Omit<CompanySettings, 'id' | 'logoUrl' | 'email'>) => api.patch('/web/admin/company-settings', {
      companyName: d.companyName,
      contactPerson: d.contactPerson,
      phone: d.phone,
      address: d.address,
      city: d.city,
      state: d.state,
      pincode: d.pincode,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-settings'] }); toast.success('Settings saved'); },
    onError: () => toast.error('Failed'),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => { const fd = new FormData(); fd.append('file', file); return api.post('/web/admin/company-settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-settings'] }); toast.success('Logo updated'); },
    onError: () => toast.error('Upload failed'),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Company Settings</h2>

      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
        <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Company Logo</h3>
        <FileUpload label="Logo" onFile={file => logoMutation.mutate(file)} loading={logoMutation.isPending} preview={data?.logoUrl} />
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
        <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Details</h3>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Input label="Company Name" {...register('companyName')} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)]">Email</label>
            <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-muted)] select-all">{data?.email ?? '—'}</p>
          </div>
          <Input label="Contact Person" {...register('contactPerson')} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Address" {...register('address')} />
          <Input label="City" {...register('city')} />
          <Input label="State" {...register('state')} />
          <Input label="Pincode" {...register('pincode')} />
          <div className="col-span-2 flex justify-end">
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
