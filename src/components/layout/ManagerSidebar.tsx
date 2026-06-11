'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wrench, Tag, Users, Ticket, UserCheck,
  Star, CreditCard, Receipt, Gift, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/tickets', label: 'Tickets', icon: Ticket },
  { href: '/manager/technicians', label: 'Technicians', icon: Wrench },
  { href: '/manager/skills', label: 'Skills', icon: Star },
  { href: '/manager/service-categories', label: 'Categories', icon: Tag },
  { href: '/manager/service-sub-categories', label: 'Sub Categories', icon: Tag },
  { href: '/manager/customers', label: 'Customers', icon: Users },
  { href: '/manager/attendance', label: 'Attendance', icon: UserCheck },
  { href: '/manager/feedback', label: 'Feedback', icon: Star },
  { href: '/manager/payments', label: 'Payments', icon: CreditCard },
  { href: '/manager/invoices', label: 'Invoices', icon: Receipt },
  { href: '/manager/offers', label: 'Offers', icon: Gift },
];

interface ManagerSidebarProps { onClose?: () => void; }

export function ManagerSidebar({ onClose }: ManagerSidebarProps) {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(href + '/');

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">FieldEaze</p>
          <p className="text-xs text-slate-400">Manager Portal</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onClose} className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
            isActive(href) ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}>
            <Icon size={16} />{label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
