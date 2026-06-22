'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{ background: 'rgba(15, 23, 42, 0.4)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-white animate-fe-scale-in',
          'shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)]',
          sizes[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-4 rounded-full bg-[var(--color-primary)]" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
