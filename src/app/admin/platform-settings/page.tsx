'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { AppSettings } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

export default function PlatformSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<AppSettings>({
    queryKey: ['app-settings'],
    queryFn: async () => (await api.get('/web/settings/charges')).data.data,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Omit<AppSettings, 'id'>>();
  useEffect(() => { if (data) reset(data); }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (d: Omit<AppSettings, 'id'>) => api.post('/web/settings/charges', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-settings'] }); toast.success('Settings saved'); },
    onError: () => toast.error('Failed'),
  });

  if (isLoading) return <PageSpinner />;

  const CheckField = ({ name, label }: { name: keyof AppSettings; label: string }) => (
    <div className="flex items-center gap-2">
      <input type="checkbox" id={name as string} {...register(name as keyof Omit<AppSettings, 'id'>)} className="h-4 w-4" />
      <label htmlFor={name as string} className="text-sm text-[var(--color-text-secondary)]">{label}</label>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Platform Settings</h2>
      <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm space-y-6">
        <div>
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Charges</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Platform Fee (₹)" type="number" step="0.01" {...register('platformFee', { valueAsNumber: true })} />
            <Input label="Tax (%)" type="number" step="0.01" {...register('taxPercentage', { valueAsNumber: true })} />
            <div className="flex flex-col gap-2">
              <CheckField name="shippingEnabled" label="Enable Shipping" />
              <Input type="number" step="0.01" {...register('shippingCharge', { valueAsNumber: true })} placeholder="Shipping ₹" />
            </div>
            <div className="flex flex-col gap-2">
              <CheckField name="handlingEnabled" label="Enable Handling" />
              <Input type="number" step="0.01" {...register('handlingCharge', { valueAsNumber: true })} placeholder="Handling ₹" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Discounts</h3>
          <div className="grid grid-cols-3 gap-4">
            {(['daily', 'weekly', 'monthly'] as const).map(period => (
              <div key={period} className="flex flex-col gap-2">
                <CheckField name={`${period}DiscountEnabled` as keyof AppSettings} label={`${period.charAt(0).toUpperCase() + period.slice(1)} Discount`} />
                <Input type="number" step="0.01" {...register(`${period}Discount` as keyof Omit<AppSettings, 'id'>, { valueAsNumber: true })} placeholder="%" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
