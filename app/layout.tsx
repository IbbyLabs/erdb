import type {Metadata} from 'next';
import {connection} from 'next/server';
import {Space_Grotesk, Unbounded} from 'next/font/google';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Easy Ratings Database (ERDB)',
  description: 'Easy Ratings Database (ERDB) for dynamic poster, backdrop, and logo ratings.',
};

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Unbounded({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export default async function RootLayout({children}: {children: React.ReactNode}) {
  await connection();

  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
