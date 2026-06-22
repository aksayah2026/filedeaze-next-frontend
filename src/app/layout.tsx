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
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-900" style={{ background: '#F8FAFC' }} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

