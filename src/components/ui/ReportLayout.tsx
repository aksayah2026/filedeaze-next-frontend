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
