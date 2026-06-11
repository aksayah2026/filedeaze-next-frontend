import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
}

export function StatsCard({ title, value, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', subtitle }: StatsCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5', iconBg)}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}
