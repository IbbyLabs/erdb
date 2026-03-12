import type {Metadata} from 'next';
import {connection} from 'next/server';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Easy Ratings Database (ERDB)',
  description: 'Easy Ratings Database (ERDB) for dynamic poster, backdrop, and logo ratings.',
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  await connection();

  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
