import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export interface FilterCardProps {
  title?: string;
  from?: string;
  to?: string;
  onFromChange?: (date: string) => void;
  onToChange?: (date: string) => void;
  onApply?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  hideDateRange?: boolean;
}

export function FilterCard({
  title = 'Filters',
  from = '',
  to = '',
  onFromChange,
  onToChange,
  onApply,
  onReset,
  isLoading,
  children,
  hideDateRange = false
}: FilterCardProps) {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const getActivePreset = () => {
    if (!from || !to) return null;
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const last7Str = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const last30Str = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const thisMonthStr = dayjs().startOf('month').format('YYYY-MM-DD');
    const lastMonthStartStr = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const lastMonthEndStr = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    if (from === todayStr && to === todayStr) return 'today';
    if (from === yesterdayStr && to === yesterdayStr) return 'yesterday';
    if (from === last7Str && to === todayStr) return 'last7';
    if (from === last30Str && to === todayStr) return 'last30';
    if (from === thisMonthStr && to === todayStr) return 'thisMonth';
    if (from === lastMonthStartStr && to === lastMonthEndStr) return 'lastMonth';
    return null;
  };

  const activePreset = getActivePreset();

  const handleQuickFilter = (range: string) => {
    const today = dayjs();
    let newFrom = from;
    let newTo = today.format('YYYY-MM-DD');

    switch (range) {
      case 'today':
        newFrom = today.format('YYYY-MM-DD');
        break;
      case 'yesterday':
        newFrom = today.subtract(1, 'day').format('YYYY-MM-DD');
        newTo = today.subtract(1, 'day').format('YYYY-MM-DD');
        break;
      case 'last7':
        newFrom = today.subtract(7, 'day').format('YYYY-MM-DD');
        break;
      case 'last30':
        newFrom = today.subtract(30, 'day').format('YYYY-MM-DD');
        break;
      case 'thisMonth':
        newFrom = today.startOf('month').format('YYYY-MM-DD');
        break;
      case 'lastMonth':
        newFrom = today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        newTo = today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        break;
    }

    if (onFromChange) onFromChange(newFrom);
    if (onToChange) onToChange(newTo);
  };

  const getButtonClass = (preset: string) => {
    return cn(
      "h-10 text-xs px-3 transition-colors",
      activePreset === preset
        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/20"
        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
    );
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex items-center gap-2">
        <Filter size={15} className="text-[var(--color-text-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      <div className="p-5 flex flex-col xl:flex-row gap-6 xl:items-end justify-between">
        <div className="flex flex-wrap items-end gap-4 flex-1">
          {children}

          {!hideDateRange && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Date Range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={from}
                    onChange={e => onFromChange && onFromChange(e.target.value)}
                    max={to && to < todayStr ? to : todayStr}
                    className="w-[140px] h-10"
                  />
                  <span className="text-[var(--color-text-muted)] text-sm">to</span>
                  <Input
                    type="date"
                    value={to}
                    onChange={e => onToChange && onToChange(e.target.value)}
                    min={from || undefined}
                    max={todayStr}
                    className="w-[140px] h-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="ghost" onClick={() => handleQuickFilter('today')} className={getButtonClass('today')}>Today</Button>
                <Button variant="ghost" onClick={() => handleQuickFilter('yesterday')} className={getButtonClass('yesterday')}>Yesterday</Button>
                <Button variant="ghost" onClick={() => handleQuickFilter('last7')} className={getButtonClass('last7')}>Last 7 Days</Button>
                <Button variant="ghost" onClick={() => handleQuickFilter('last30')} className={getButtonClass('last30')}>Last 30 Days</Button>
                <Button variant="ghost" onClick={() => handleQuickFilter('thisMonth')} className={getButtonClass('thisMonth')}>This Month</Button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onReset && (
            <Button variant="secondary" onClick={onReset} className="h-10 px-5" disabled={isLoading}>
              <RefreshCw size={14} className="mr-2" /> Reset
            </Button>
          )}
          {onApply && (
            <Button variant="primary" onClick={onApply} className="h-10 px-6 shadow-md shadow-[var(--color-primary-light)]" disabled={isLoading}>
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
