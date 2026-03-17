import type {Metadata, Viewport} from 'next';
import {connection} from 'next/server';
import './globals.css'; // Global styles

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'IbbyLabs ERDB | Stateless Ratings Engine',
  description: 'ERDB generates poster, backdrop, and logo images with dynamic ratings for addons and media tools.',
  applicationName: 'IbbyLabs ERDB',
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'IbbyLabs ERDB',
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      {url: '/favicon.svg', type: 'image/svg+xml'},
      {url: '/favicon.ico'},
      {url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png'},
      {url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png'},
      {url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png'},
    ],
    apple: [{url: '/apple-touch-icon.png', sizes: '180x180'}],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    type: 'website',
    title: 'IbbyLabs ERDB',
    description: 'Stateless ratings image engine for posters, backdrops, logos, and Stremio addon integrations.',
    images: ['/favicon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IbbyLabs ERDB',
    description: 'Stateless ratings image engine for posters, backdrops, logos, and Stremio addon integrations.',
    images: ['/favicon.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#020108',
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  await connection();

  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
