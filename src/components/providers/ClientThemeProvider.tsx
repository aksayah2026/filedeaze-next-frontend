'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';

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
        token: {
          colorPrimary: primaryColor,
          fontFamily: 'Inter, sans-serif',
          borderRadius: 6,
          colorSuccess: '#22C55E',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#2563EB',
          colorBgLayout: '#F8FAFC',
        },
        components: {
          Button: {
            colorPrimary: primaryColor,
            borderRadius: 6,
            controlHeight: 36,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 36,
            colorBorder: '#E2E8F0',
          },
          Select: {
            borderRadius: 6,
            controlHeight: 36,
            colorBorder: '#E2E8F0',
          },
          Table: {
            headerBg: '#F8FAFC',
            headerColor: '#0F172A',
            headerBorderRadius: 6,
            rowHoverBg: 'rgba(248, 250, 252, 0.6)',
          },
          Modal: {
            borderRadiusLG: 12,
          },
          Card: {
            borderRadiusLG: 12,
            colorBorderSecondary: '#E2E8F0',
          },
        },
      }}
    >
      <AntdRegistry>
        <div className={`theme-${roleTheme} min-h-full flex flex-col flex-1`}>
          {children}
        </div>
      </AntdRegistry>
    </ConfigProvider>
  );
}
