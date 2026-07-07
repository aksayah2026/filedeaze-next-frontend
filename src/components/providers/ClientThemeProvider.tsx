'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';

export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [roleTheme, setRoleTheme] = useState<'super-admin' | 'admin' | 'manager' | 'default'>('default');

  useEffect(() => {
    let theme: 'super-admin' | 'admin' | 'manager' | 'default' = 'default';
    if (pathname?.startsWith('/super-admin')) {
      theme = 'super-admin';
    } else if (pathname?.startsWith('/admin')) {
      theme = 'admin';
    } else if (pathname?.startsWith('/manager')) {
      theme = 'manager';
    }

    setRoleTheme(theme);

    // Apply class to body for global CSS/Tailwind variables
    const body = document.body;
    if (body) {
      body.classList.remove('theme-super-admin', 'theme-admin', 'theme-manager', 'theme-default');
      body.classList.add(`theme-${theme}`);
    }
  }, [pathname]);

  const activeColors = {
    'super-admin': '#2563EB',
    'admin': '#14B8A6',
    'manager': '#22C55E',
    'default': '#2563EB',
  };

  const primaryColor = activeColors[roleTheme];

  return (
    <ConfigProvider
      theme={{
        cssVar: {},
        token: {
          colorPrimary: primaryColor,
          fontFamily: 'Inter, sans-serif',
          borderRadius: 10,
          colorSuccess: '#22C55E',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#2563EB',
          // Use CSS variables for layout colors to avoid JS re-renders
          colorBgLayout: 'var(--color-bg)',
          colorTextBase: 'var(--color-text-primary)',
          colorBgContainer: 'var(--color-surface)',
          colorBorder: 'var(--color-border)',
          colorBgElevated: 'var(--color-surface-elevated)',
          colorFillSecondary: 'var(--color-sidebar-active)',
          colorTextSecondary: 'var(--color-text-secondary)',
          colorTextTertiary: 'var(--color-text-muted)',
          colorTextQuaternary: 'var(--color-text-muted)',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            colorBorder: 'var(--color-border)',
          },
          Input: {
            borderRadius: 10,
            controlHeight: 36,
            colorBorder: 'var(--color-border-input)',
            colorBgContainer: 'var(--color-input-bg)',
            colorTextPlaceholder: 'var(--color-text-muted)',
          },
          Select: {
            borderRadius: 10,
            controlHeight: 36,
            colorBorder: 'var(--color-border-input)',
            colorBgContainer: 'var(--color-input-bg)',
            colorTextPlaceholder: 'var(--color-text-muted)',
            optionSelectedBg: 'var(--color-surface-hover)',
          },
          DatePicker: {
            borderRadius: 10,
            controlHeight: 36,
            colorBorder: 'var(--color-border-input)',
            colorBgContainer: 'var(--color-input-bg)',
            colorTextPlaceholder: 'var(--color-text-muted)',
          },
          Table: {
            headerBg: 'var(--color-surface-elevated)',
            headerColor: 'var(--color-text-primary)',
            headerBorderRadius: 0,
            rowHoverBg: 'var(--color-surface-hover)',
            borderColor: 'var(--color-border)',
            headerSortActiveBg: 'var(--color-surface-elevated)',
          },
          Modal: {
            borderRadiusLG: 14,
            contentBg: 'var(--color-surface)',
            headerBg: 'var(--color-surface)',
            footerBg: 'var(--color-surface)',
          },
          Drawer: {
            colorBgElevated: 'var(--color-surface)',
          },
          Card: {
            borderRadiusLG: 12,
            colorBorderSecondary: 'var(--color-border)',
            colorBgContainer: 'var(--color-surface)',
          },
          Dropdown: {
            borderRadiusLG: 10,
            colorBgElevated: 'var(--color-surface-elevated)',
            controlItemBgHover: 'var(--color-surface-hover)',
            colorBorder: 'var(--color-border)',
          },
          Popover: {
            borderRadiusLG: 10,
            colorBgElevated: 'var(--color-surface-elevated)',
          },
        },
      }}
    >
      <AntdRegistry>
        <div className={`theme-${roleTheme} min-h-full flex flex-col flex-1 transition-colors duration-300 ease-in-out`}>
          {children}
        </div>
      </AntdRegistry>
    </ConfigProvider>
  );
}
