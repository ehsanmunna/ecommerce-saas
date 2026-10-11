import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { SessionProvider } from './lib/session-context';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-body' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Frozen — Trendy & Stylish Outfits for Kids',
  description: 'Storefront',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} font-body antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
