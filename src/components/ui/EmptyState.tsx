import { Inbox } from 'lucide-react';
import { ReactNode } from 'react';

export function EmptyState({
  message = 'No records found',
  description = 'There is nothing to display here yet.',
  icon: Icon = Inbox,
  action,
}: {
  message?: string;
  description?: string;
  icon?: React.ElementType;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-[var(--color-surface-elevated)] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">{message}</p>
      <p className="text-xs text-[var(--color-text-muted)] text-center max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
