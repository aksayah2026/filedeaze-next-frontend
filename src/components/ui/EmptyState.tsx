import { Inbox } from 'lucide-react';

export function EmptyState({
  message = 'No records found',
  description = 'There is nothing to display here yet.',
  icon: Icon = Inbox,
}: {
  message?: string;
  description?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700 mb-1">{message}</p>
      <p className="text-xs text-slate-400 text-center max-w-xs">{description}</p>
    </div>
  );
}
