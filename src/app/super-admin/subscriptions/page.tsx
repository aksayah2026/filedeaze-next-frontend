'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Tenant, Plan } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

const createSchema = z.object({
  tenantId: z.string().min(1, 'Please select a tenant'),
  planId: z.string().min(1, 'Please select a plan'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

const renewSchema = z.object({
  subscriptionId: z.string().min(1, 'Please select a subscription'),
  endDate: z.string().min(1, 'End date is required'),
});

type CreateForm = z.infer<typeof createSchema>;
type RenewForm = z.infer<typeof renewSchema>;

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const { data: tenants = [] } = useQuery<Tenant[]>({ queryKey: ['tenants'], queryFn: async () => (await api.get('/web/super-admin/tenants')).data.data });
  const { data: plans = [] } = useQuery<Plan[]>({ queryKey: ['plans'], queryFn: async () => (await api.get('/web/super-admin/plans')).data.data });

  const { register: rc, handleSubmit: hc, reset: resetC, formState: { errors: ec, isSubmitting: sc } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const { register: rr, handleSubmit: hr, reset: resetR, formState: { errors: er, isSubmitting: sr } } = useForm<RenewForm>({ resolver: zodResolver(renewSchema) });

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => api.post('/web/super-admin/subscriptions', d),
    onSuccess: () => { toast.success('Subscription created'); resetC(); qc.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: () => toast.error('Failed'),
  });

  const renewMutation = useMutation({
    mutationFn: ({ subscriptionId, endDate }: RenewForm) => api.patch(`/web/super-admin/subscriptions/${subscriptionId}/renew`, { endDate }),
    onSuccess: () => { toast.success('Subscription renewed'); resetR(); },
    onError: () => toast.error('Failed'),
  });

  const tenantOptions = tenants.map(t => ({ value: t.id, label: `${t.companyName} (${t.tenantCode})` }));
  const planOptions = plans.map(p => ({ value: p.id, label: `${p.name} — ₹${p.price}` }));

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Subscriptions</h2>

      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
        <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Create Subscription</h3>
        <form onSubmit={hc(d => createMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Select label="Tenant" options={tenantOptions} placeholder="Select Tenant" {...rc('tenantId')} error={ec.tenantId?.message} />
          <Select label="Plan" options={planOptions} placeholder="Select Plan" {...rc('planId')} error={ec.planId?.message} />
          <Input label="Start Date" type="date" {...rc('startDate')} error={ec.startDate?.message} />
          <Input label="End Date" type="date" {...rc('endDate')} error={ec.endDate?.message} />
          <div className="col-span-2 flex justify-end"><Button type="submit" loading={sc}>Create</Button></div>
        </form>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
        <h3 className="font-medium text-[var(--color-text-secondary)] mb-4">Renew Subscription</h3>
        <form onSubmit={hr(d => renewMutation.mutate(d))} className="grid grid-cols-2 gap-4">
          <Input label="Subscription ID" placeholder="sub_xxxx" {...rr('subscriptionId')} error={er.subscriptionId?.message} />
          <Input label="New End Date" type="date" {...rr('endDate')} error={er.endDate?.message} />
          <div className="col-span-2 flex justify-end"><Button type="submit" loading={sr}>Renew</Button></div>
        </form>
      </div>
    </div>
  );
}
