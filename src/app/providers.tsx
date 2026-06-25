'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { ClientThemeProvider } from '@/components/providers/ClientThemeProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ClientThemeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ClientThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
