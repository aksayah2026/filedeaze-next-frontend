'use client';

import { useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { IconHandle } from '@animateicons/react';

export interface NavItemDef {
  href: string;
  label: string;
  /** The animated icon component from @animateicons/react/lucide */
  icon: React.ForwardRefExoticComponent<
    { size?: number; color?: string; isAnimated?: boolean; className?: string } & React.RefAttributes<IconHandle>
  >;
}

interface SidebarNavItemProps {
  item: NavItemDef;
  isActive: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
}

export function SidebarNavItem({ item, isActive, isCollapsed, onClose }: SidebarNavItemProps) {
  const iconRef = useRef<IconHandle>(null);
  const [isPopping, setIsPopping] = useState(false);

  const handleMouseEnter = useCallback(() => {
    iconRef.current?.startAnimation();
  }, []);

  const handleMouseLeave = useCallback(() => {
    iconRef.current?.stopAnimation();
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsPopping(true);
  }, []);

  const Icon = item.icon;

  /* ── Collapsed: icon-only + glass tooltip ──────────────── */
  if (isCollapsed) {
    return (
      <div className="sidebar-tooltip-container flex justify-center mb-0.5">
        <Link
          href={item.href}
          onClick={onClose}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          title={item.label}
          className={cn(
            'relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl',
            'transition-all duration-200',
            isActive
              ? 'bg-[var(--color-sidebar-active)] text-[var(--color-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-sidebar-hover)]',
            'sb-nav-item'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center shrink-0 transition-all duration-200',
              isPopping && 'sidebar-icon-popping',
              isActive ? 'text-[var(--color-primary)]' : ''
            )}
            style={{ lineHeight: 0 }}
            onAnimationEnd={() => setIsPopping(false)}
          >
            <Icon ref={iconRef} size={16} />
          </div>
        </Link>
        {/* Premium glass tooltip */}
        <span className="sidebar-tooltip">{item.label}</span>
      </div>
    );
  }

  /* ── Expanded: icon + label ─────────────────────────────── */
  return (
    <Link
      href={item.href}
      onClick={onClose}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        // Layout — identical to the original working sidebar
        'relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium w-full mb-0.5',
        // Group for hover children
        'group',
        // Transitions
        'transition-all duration-200',
        // Active vs default
        isActive
          ? [
            'bg-[var(--color-sidebar-active)] text-[var(--color-primary)]',
            'shadow-[0_1px_6px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]',
            'scale-[1.01]',
          ]
          : [
            'text-[var(--color-text-secondary)]',
            'hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-sidebar-hover)]',
            'hover:-translate-y-0.5',
          ],
        // Pop animation class applied on click
        isPopping && 'sb-nav-item-popping'
      )}
      onAnimationEnd={() => setIsPopping(false)}
    >
      {/* Glowing left indicator — only when active */}
      {isActive && <span className="sidebar-active-indicator" />}

      {/* Icon container — explicit sizing to constrain animateicons div output */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 w-[18px] h-[18px] transition-all duration-200',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:scale-[1.08] group-hover:rotate-[3deg]',
          isPopping && 'sidebar-icon-popping'
        )}
        style={{ lineHeight: 0 }}
      >
        <Icon ref={iconRef} size={16} />
      </div>

      {/* Label */}
      <span
        className={cn(
          'truncate transition-all duration-200',
          isActive
            ? 'font-semibold text-[var(--color-primary)]'
            : 'group-hover:text-[var(--color-text-primary)] group-hover:tracking-[0.012em]'
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
