import React from 'react';
import { Download, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface ReportLayoutProps {
  title: string;
  description: string;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  children: React.ReactNode;
  
  // Filter Props
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function ReportLayout({
  title,
  description,
  onExportCsv,
  onExportPdf,
  onExportExcel,
  children,
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onReset,
  isLoading
}: ReportLayoutProps) {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const getActivePreset = () => {
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
    
    switch(range) {
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
    
    onFromChange(newFrom);
    onToChange(newTo);
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <Button variant="secondary" onClick={onExportPdf} className="h-9 px-3 bg-[var(--color-surface)] shadow-sm">
              <Download size={14} className="mr-1.5" /> PDF
            </Button>
          )}
          {onExportExcel && (
            <Button variant="secondary" onClick={onExportExcel} className="h-9 px-3 bg-[var(--color-surface)] shadow-sm">
              <Download size={14} className="mr-1.5" /> Excel
            </Button>
          )}
          {onExportCsv && (
            <Button variant="secondary" onClick={onExportCsv} className="h-9 px-3 bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)] border-[var(--color-primary-light)]">
              <Download size={14} className="mr-1.5" /> CSV
            </Button>
          )}
        </div>
      </div>

      {/* Modern Filter Card */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex items-center gap-2">
          <Filter size={15} className="text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filter Report</h3>
        </div>
        <div className="p-5 flex flex-col xl:flex-row gap-6 xl:items-end justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">Date Range</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={from} 
                  onChange={e => onFromChange(e.target.value)} 
                  max={to && to < todayStr ? to : todayStr} 
                  className="w-[140px] h-10"
                />
                <span className="text-[var(--color-text-muted)] text-sm">to</span>
                <Input 
                  type="date" 
                  value={to} 
                  onChange={e => onToChange(e.target.value)} 
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
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onReset} className="h-10 px-5" disabled={isLoading}>
              <RefreshCw size={14} className="mr-2" /> Reset
            </Button>
            <Button variant="primary" onClick={onApply} className="h-10 px-6 shadow-md shadow-[var(--color-primary-light)]" disabled={isLoading}>
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("space-y-6 transition-opacity duration-300", isLoading ? "opacity-60 pointer-events-none" : "opacity-100")}>
        {children}
      </div>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {children}
    </div>
  );
}

export function InsightsCard({ insights }: { insights: string[] }) {
  if (!insights?.length) return null;
  
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-[rgba(59,130,246,0.05)] dark:to-[rgba(99,102,241,0.05)] border border-blue-100 dark:border-[rgba(59,130,246,0.15)] p-5 shadow-sm overflow-hidden mt-6">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={64} className="text-blue-500" />
      </div>
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Sparkles size={16} />
        </div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI Business Insights</h3>
      </div>
      <ul className="space-y-3 relative z-10">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {/* Highlight numbers and percentages with a subtle style */}
              {insight.split(/(\d+(?:\.\d+)?%?)/g).map((part, i) => 
                /\d/.test(part) ? (
                  <strong key={i} className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-500/10 px-1 rounded mx-0.5">{part}</strong>
                ) : (
                  part
                )
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
