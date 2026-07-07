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

  const getPresetClass = (preset: string) => {
    return cn(
      'h-7 text-xs px-2.5 rounded-md font-medium transition-colors',
      activePreset === preset
        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]'
    );
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      {/* Single-row compact filter bar */}
      <div className="px-4 py-2.5 flex flex-wrap xl:flex-nowrap items-center gap-3">

        {/* Filter icon + label */}
        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] shrink-0">
          <Filter size={13} />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] hidden sm:inline">Filters</span>
        </div>

        {/* Divider */}
        <div className="hidden xl:block w-px h-5 bg-[var(--color-border)] shrink-0" />

        {/* Extra filter slots (e.g., Status dropdown) */}
        {children && (
          <div className="flex items-center gap-3 flex-wrap">
            {children}
          </div>
        )}

        {!hideDateRange && (
          <>
            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Input
                type="date"
                value={from}
                onChange={e => onFromChange && onFromChange(e.target.value)}
                max={to && to < todayStr ? to : todayStr}
                className="w-[130px] h-8 text-xs"
              />
              <span className="text-[var(--color-text-muted)] text-xs">–</span>
              <Input
                type="date"
                value={to}
                onChange={e => onToChange && onToChange(e.target.value)}
                min={from || undefined}
                max={todayStr}
                className="w-[130px] h-8 text-xs"
              />
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => handleQuickFilter('today')} className={getPresetClass('today')}>Today</button>
              <button onClick={() => handleQuickFilter('yesterday')} className={getPresetClass('yesterday')}>Yesterday</button>
              <button onClick={() => handleQuickFilter('last7')} className={getPresetClass('last7')}>Last 7 Days</button>
              <button onClick={() => handleQuickFilter('last30')} className={getPresetClass('last30')}>Last 30 Days</button>
              <button onClick={() => handleQuickFilter('thisMonth')} className={getPresetClass('thisMonth')}>This Month</button>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onReset && (
            <Button
              variant="secondary"
              onClick={onReset}
              className="h-8 px-3 text-xs"
              disabled={isLoading}
            >
              <RefreshCw size={12} className="mr-1.5" /> Reset
            </Button>
          )}
          {onApply && (
            <Button
              variant="primary"
              onClick={onApply}
              className="h-8 px-4 text-xs shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Applying…' : 'Apply Filters'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
