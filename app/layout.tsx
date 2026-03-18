import type {Metadata, Viewport} from 'next';
import {connection} from 'next/server';
import {Space_Grotesk, Unbounded} from 'next/font/google';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const fullBrandName = 'IbbyLabs Easy Ratings Database';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: `${fullBrandName} | Stateless Ratings Engine`,
  description: 'ERDB generates poster, backdrop, and logo images with dynamic ratings for addons and media tools.',
  applicationName: fullBrandName,
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: fullBrandName,
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
    title: fullBrandName,
    description: 'Stateless ratings image engine for posters, backdrops, logos, and Stremio addon integrations.',
    images: ['/favicon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: fullBrandName,
    description: 'Stateless ratings image engine for posters, backdrops, logos, and Stremio addon integrations.',
    images: ['/favicon.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#020108',
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
