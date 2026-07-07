import React from 'react';
import { Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { FilterCard } from './FilterCard';

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
  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-6">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">{title}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onExportPdf && (
            <Button variant="secondary" onClick={onExportPdf} className="h-8 px-3 text-xs bg-[var(--color-surface)] shadow-sm">
              <Download size={12} className="mr-1.5" /> PDF
            </Button>
          )}
          {onExportExcel && (
            <Button variant="secondary" onClick={onExportExcel} className="h-8 px-3 text-xs bg-[var(--color-surface)] shadow-sm">
              <Download size={12} className="mr-1.5" /> Excel
            </Button>
          )}
          {onExportCsv && (
            <Button variant="secondary" onClick={onExportCsv} className="h-8 px-3 text-xs bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)] border-[var(--color-primary-light)]">
              <Download size={12} className="mr-1.5" /> CSV
            </Button>
          )}
        </div>
      </div>

      {/* Compact Filter Bar */}
      <FilterCard
        from={from}
        to={to}
        onFromChange={onFromChange}
        onToChange={onToChange}
        onApply={onApply}
        onReset={onReset}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <div className={cn("space-y-4 transition-opacity duration-300", isLoading ? "opacity-60 pointer-events-none" : "opacity-100")}>
        {children}
      </div>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {children}
    </div>
  );
}

/** Compact inline insights — designed to slot into a 4-col side panel */
export function InsightsCard({ insights }: { insights: string[] }) {
  if (!insights?.length) return null;

  return (
    <div className="relative rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-[rgba(59,130,246,0.06)] dark:to-[rgba(99,102,241,0.06)] border border-blue-100 dark:border-[rgba(59,130,246,0.15)] p-3 overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-[0.06]">
        <Sparkles size={40} className="text-blue-500" />
      </div>
      <div className="flex items-center gap-1.5 mb-2 relative z-10">
        <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Sparkles size={11} />
        </div>
        <h3 className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wide">AI Insights</h3>
      </div>
      <ul className="space-y-1.5 relative z-10">
        {insights.map((insight, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {insight.split(/(\d+(?:\.\d+)?%?)/g).map((part, i) =>
                /\d/.test(part) ? (
                  <strong key={i} className="font-semibold text-blue-700 dark:text-blue-400">{part}</strong>
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
