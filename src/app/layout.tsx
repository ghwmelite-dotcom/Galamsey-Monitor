import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Galamsey Monitor - Fighting Illegal Mining in Ghana',
  description: 'Comprehensive platform for monitoring, reporting, and combating illegal small-scale mining (galamsey) in Ghana. Track incidents, water quality, and affected areas.',
  keywords: ['galamsey', 'illegal mining', 'Ghana', 'environment', 'water pollution', 'monitoring'],
  openGraph: {
    title: 'Galamsey Monitor',
    description: 'Protecting Ghana\'s environment by monitoring and reporting illegal mining activities.',
    type: 'website',
    locale: 'en_GH',
    siteName: 'Galamsey Monitor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galamsey Monitor',
    description: 'Protecting Ghana\'s environment by monitoring and reporting illegal mining activities.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
