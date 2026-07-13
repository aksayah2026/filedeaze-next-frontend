'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/lib/axios';
import { PlatformUpi } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { QrCode, Smartphone, Settings2, CheckCircle2, UploadCloud } from 'lucide-react';

interface UpiForm {
  upiId: string;
  upiAccountName: string;
  upiQrImageUrl: string;
}

const UPI_ID_PATTERN = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;

export default function PlatformSettingsPage() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PlatformUpi>({
    queryKey: ['platform-upi'],
    queryFn: async () => (await api.get('/web/super-admin/platform-upi')).data.data,
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<UpiForm>();

  useEffect(() => {
    if (data) reset({
      upiId: data.upiId ?? '',
      upiAccountName: data.upiAccountName ?? '',
      upiQrImageUrl: data.upiQrImageUrl ?? '',
    });
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (dto: UpiForm) => api.patch('/web/super-admin/platform-upi', dto).then(() => dto),
    onSuccess: (dto) => {
      qc.invalidateQueries({ queryKey: ['platform-upi'] });
      toast.success('UPI settings saved');
      reset(dto);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to save UPI settings'),
  });

  const uploadQrMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/web/super-admin/platform-upi/upload-qr', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['platform-upi'] });
      reset({ ...watch(), upiQrImageUrl: res.data.data.upiQrImageUrl });
      toast.success('QR code uploaded');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to upload QR code'),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadQrMutation.mutateAsync(file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const upiId = watch('upiId');
  const upiAccountName = watch('upiAccountName');
  const upiQrImageUrl = watch('upiQrImageUrl');
  const upiString = upiId
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiAccountName || 'FieldEaze')}&cu=INR`
    : '';

  if (isLoading) return <PageSpinner />;
  if (isError) return <ErrorState error={error} onRetry={refetch} isRetrying={isFetching} />;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
          <Settings2 size={19} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Platform Settings</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            The single source of truth for platform payment configuration
          </p>
        </div>
      </div>

      {/* UPI Settings Card */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
          <QrCode size={15} className="text-blue-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">UPI Payment Settings</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-[var(--color-surface-elevated)] border border-blue-100 rounded-xl px-4 py-3">
            <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              This UPI ID and QR code are shown to tenants on their subscription page and used to
              generate payment QR codes for offline subscription payments. This is the only place
              in the app where these can be edited.
            </p>
          </div>

          <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
            <Input
              label="UPI ID (VPA) *"
              placeholder="yourname@okhdfcbank"
              {...register('upiId', {
                required: 'UPI ID is required',
                pattern: { value: UPI_ID_PATTERN, message: 'Please provide a valid UPI ID (e.g. name@bank)' },
              })}
              error={errors.upiId?.message}
            />
            <Input
              label="Account Name *"
              placeholder="FieldEaze Pvt Ltd"
              {...register('upiAccountName', { required: 'Account name is required' })}
              error={errors.upiAccountName?.message}
            />

            {/* QR Image — upload or URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">QR Code Image</label>
              <div className="flex items-center gap-3">
                {upiQrImageUrl && (
                  <img
                    src={upiQrImageUrl}
                    alt="UPI QR"
                    className="h-14 w-14 rounded-lg border border-[var(--color-border)] object-contain shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--color-border-strong)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:border-blue-400 transition-colors disabled:opacity-50"
                >
                  <UploadCloud size={15} />
                  {uploading ? 'Uploading…' : 'Upload QR Image'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <Input
              label="QR Image URL (optional — used if no image is uploaded)"
              placeholder="https://cdn.example.com/upi-qr.png"
              hint="If a QR image is uploaded above, it takes priority over this URL."
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
      {(upiQrImageUrl || upiString) && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] animate-fe-fade-in">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 flex items-center gap-2">
            <QrCode size={15} className="text-violet-500" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Live QR Preview</h3>
            <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-[var(--color-surface-elevated)] border border-emerald-100 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="p-6 flex items-start gap-6 flex-col sm:flex-row">
            {/* QR — prefer the actual uploaded/URL image, fall back to an auto-generated code */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm">
                {upiQrImageUrl ? (
                  <img src={upiQrImageUrl} alt="UPI QR" className="h-[140px] w-[140px] object-contain" />
                ) : (
                  <QRCodeCanvas value={upiString} size={140} level="M" marginSize={2} />
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">Scan with any UPI app</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {upiId && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">UPI ID</p>
                  <p className="font-mono font-semibold text-[var(--color-text-primary)] text-sm">{upiId}</p>
                </div>
              )}
              {upiAccountName && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Account Name</p>
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm">{upiAccountName}</p>
                </div>
              )}
              {upiString && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">UPI String</p>
                  <p className="font-mono text-xs text-[var(--color-text-muted)] break-all max-w-xs bg-[var(--color-surface-elevated)] border border-[var(--color-border)] p-2 rounded-lg">
                    {upiString}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
