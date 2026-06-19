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
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Platform Settings</h2>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-1">UPI Payment Settings</h3>
        <p className="text-xs text-gray-400 mb-5">
          This UPI ID is shown to tenants on their subscription page and used to generate payment QR codes.
        </p>

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

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>

      {/* Live QR preview */}
      {previewQrString && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4">QR Preview</h3>
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <QRCodeCanvas value={previewQrString} size={140} level="M" marginSize={2} />
              <p className="text-xs text-gray-400">Scan with any UPI app</p>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-400">UPI ID</p>
                <p className="font-mono font-medium text-gray-800">{upiId}</p>
              </div>
              {upiAccountName && (
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="font-medium text-gray-800">{upiAccountName}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Note</p>
                <p className="text-xs text-gray-500 break-all max-w-xs">{previewQrString}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
