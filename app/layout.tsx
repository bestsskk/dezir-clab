import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dezir Clab | Made for Young Men & Divorced Women for Fun & Chat',
  description: 'An exclusive, discreet private community connecting energetic young men with charming divorced & mature independent women for fun, dating and private chats.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Dezir Clab | Private Chat & Social Community',
    description: 'An exclusive, discreet private community connecting energetic young men with charming divorced & mature independent women for fun, dating and private chats.',
    siteName: 'Dezir Clab',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
