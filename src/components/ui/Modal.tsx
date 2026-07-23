'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none"
      style={{ background: 'rgba(15, 23, 42, 0.4)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Dialog — capped to the viewport height with the body scrolling internally, so tall
          forms never push the close button or footer buttons off-screen on short viewports. */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-[var(--color-surface)] animate-fe-scale-in',
          'shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)]',
          'transition-colors duration-250',
          'max-h-[90vh] flex flex-col',
          sizes[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-4 rounded-full bg-[var(--color-primary)]" />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-4 sm:px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
