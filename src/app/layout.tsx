import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FieldEaze',
  description: 'Field Service Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full text-[var(--color-text-primary)] bg-[var(--color-bg)] transition-colors duration-250 ease-in-out" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

