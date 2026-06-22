'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { QrCode, Smartphone, Settings2, CheckCircle2 } from 'lucide-react';

interface PlatformUpi {
  upiId: string | null;
  upiAccountName: string | null;
  upiQrImageUrl: string | null;
}

interface UpiForm {
  upiId: string;
  upiAccountName: string;
  upiQrImageUrl: string;
}

export default function PlatformSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PlatformUpi>({
    queryKey: ['platform-upi'],
    queryFn: async () => (await api.get('/web/super-admin/platform-upi')).data.data,
  });

  const { register, handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } = useForm<UpiForm>();

  useEffect(() => {
    if (data) reset({
      upiId: data.upiId ?? '',
      upiAccountName: data.upiAccountName ?? '',
      upiQrImageUrl: data.upiQrImageUrl ?? '',
    });
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (dto: UpiForm) => api.patch('/web/super-admin/platform-upi', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-upi'] });
      toast.success('UPI settings saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save'),
  });

  const upiId = watch('upiId');
  const upiAccountName = watch('upiAccountName');
  const previewQrString = upiId
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiAccountName || 'FieldEaze')}&cu=INR`
    : '';

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Settings2 size={19} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">Configure global platform preferences</p>
        </div>
      </div>

      {/* UPI Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <QrCode size={15} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800">UPI Payment Settings</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              This UPI ID is shown to tenants on their subscription page and used to generate payment QR codes for offline payments.
            </p>
          </div>

          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
            <Input
              label="UPI ID (VPA)"
              placeholder="yourname@upi"
              {...register('upiId')}
            />
            <Input
              label="Account Name"
              placeholder="FieldEaze Pvt Ltd"
              {...register('upiAccountName')}
            />
            <Input
              label="QR Image URL (optional)"
              placeholder="https://cdn.example.com/upi-qr.png"
              hint="If provided, this image is shown instead of the auto-generated QR."
              {...register('upiQrImageUrl')}
            />

            <div className="flex justify-end pt-1">
              <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                <CheckCircle2 size={15} />
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* QR Preview Card */}
      {previewQrString && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] animate-fe-fade-in">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <QrCode size={15} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-800">Live QR Preview</h3>
            <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="p-6 flex items-start gap-6 flex-col sm:flex-row">
            {/* QR */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <QRCodeCanvas value={previewQrString} size={140} level="M" marginSize={2} />
              </div>
              <p className="text-xs text-slate-400">Scan with any UPI app</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">UPI ID</p>
                <p className="font-mono font-semibold text-slate-800 text-sm">{upiId}</p>
              </div>
              {upiAccountName && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Account Name</p>
                  <p className="font-semibold text-slate-800 text-sm">{upiAccountName}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">UPI String</p>
                <p className="font-mono text-xs text-slate-500 break-all max-w-xs bg-slate-50 border border-slate-100 p-2 rounded-lg">
                  {previewQrString}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
