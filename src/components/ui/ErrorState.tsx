'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { getErrorMessage } from '@/lib/utils';

export function ErrorState({
  title = 'Unable to load data',
  error,
  message,
  onRetry,
  isRetrying,
}: {
  title?: string;
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] max-w-xs mb-4">
        {message ?? getErrorMessage(error)}
      </p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} loading={isRetrying}>
          <RotateCw size={13} /> Retry
        </Button>
      )}
    </div>
  );
}
