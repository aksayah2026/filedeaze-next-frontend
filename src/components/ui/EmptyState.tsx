import { Inbox } from 'lucide-react';

export function EmptyState({ message = 'No records found', icon: Icon = Inbox }: { message?: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon size={36} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
