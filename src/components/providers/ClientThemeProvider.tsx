'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';

export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [roleTheme, setRoleTheme] = useState<'super-admin' | 'admin' | 'manager' | 'default'>('default');
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';

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
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#4F8BFF' : primaryColor,
          fontFamily: 'Inter, sans-serif',
          borderRadius: 10,
          colorSuccess: isDark ? '#34D399' : '#22C55E',
          colorWarning: isDark ? '#FBBF24' : '#F59E0B',
          colorError: isDark ? '#F87171' : '#EF4444',
          colorInfo: isDark ? '#60A5FA' : '#2563EB',
          colorBgLayout: isDark ? '#0E1016' : '#F8FAFC',
          colorTextBase: isDark ? '#F5F7FA' : '#0F172A',
          colorBgContainer: isDark ? '#181B24' : '#FFFFFF',
          colorBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
          colorBgElevated: isDark ? '#1F2330' : '#FFFFFF',
          colorFillSecondary: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          colorTextSecondary: isDark ? '#C6CBD5' : '#475569',
          colorTextTertiary: isDark ? '#8F98A8' : '#94A3B8',
          colorTextQuaternary: isDark ? '#8F98A8' : '#CBD5E1',
        },
        components: {
          Button: {
            colorPrimary: isDark ? '#4F8BFF' : primaryColor,
            borderRadius: 8,
            controlHeight: 36,
            colorBorder: isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0',
          },
          Input: {
            borderRadius: 10,
            controlHeight: 36,
            colorBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            colorBgContainer: isDark ? '#242938' : '#FFFFFF',
            colorTextPlaceholder: isDark ? '#8F98A8' : '#94A3B8',
            activeShadow: isDark ? '0 0 0 2px rgba(79,139,255,0.20)' : '0 0 0 2px rgba(37,99,235,0.12)',
          },
          Select: {
            borderRadius: 10,
            controlHeight: 36,
            colorBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            colorBgContainer: isDark ? '#242938' : '#FFFFFF',
            colorTextPlaceholder: isDark ? '#8F98A8' : '#94A3B8',
            optionSelectedBg: isDark ? '#2A3042' : '#EFF6FF',
          },
          DatePicker: {
            borderRadius: 10,
            controlHeight: 36,
            colorBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            colorBgContainer: isDark ? '#242938' : '#FFFFFF',
            colorTextPlaceholder: isDark ? '#8F98A8' : '#94A3B8',
          },
          Table: {
            headerBg: isDark ? '#1F2330' : '#F8FAFC',
            headerColor: isDark ? '#C6CBD5' : '#0F172A',
            headerBorderRadius: 0,
            rowHoverBg: isDark ? '#2A3042' : 'rgba(248, 250, 252, 0.8)',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
            headerSortActiveBg: isDark ? '#2A3042' : '#F1F5F9',
          },
          Modal: {
            borderRadiusLG: 14,
            contentBg: isDark ? '#181B24' : '#FFFFFF',
            headerBg: isDark ? '#181B24' : '#FFFFFF',
            footerBg: isDark ? '#181B24' : '#FFFFFF',
          },
          Drawer: {
            colorBgElevated: isDark ? '#181B24' : '#FFFFFF',
          },
          Card: {
            borderRadiusLG: 12,
            colorBorderSecondary: isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            colorBgContainer: isDark ? '#181B24' : '#FFFFFF',
          },
          Dropdown: {
            borderRadiusLG: 10,
            colorBgElevated: isDark ? '#1F2330' : '#FFFFFF',
            controlItemBgHover: isDark ? '#2A3042' : '#F8FAFC',
            colorBorder: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
          },
          Popover: {
            borderRadiusLG: 10,
            colorBgElevated: isDark ? '#1F2330' : '#FFFFFF',
          },
          Tooltip: {
            colorBgSpotlight: isDark ? '#2A3042' : '#0F172A',
          },
        },
      }}
    >
      <AntdRegistry>
        <div className={`theme-${roleTheme} ${isDark ? 'dark' : ''} min-h-full flex flex-col flex-1 bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-250 ease-in-out`}>
          {children}
        </div>
      </AntdRegistry>
    </ConfigProvider>
  );
}
