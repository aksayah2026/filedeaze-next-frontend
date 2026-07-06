import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FieldEaze',
  description: 'Field Service Management',
  icons: {
    icon: '/fieldeaze_logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('fieldeaze-theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full text-[var(--color-text-primary)] bg-[var(--color-bg)] transition-colors duration-300 ease-in-out" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

