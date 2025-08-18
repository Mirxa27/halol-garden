import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const cairo = Cairo({ 
  subsets: ['arabic'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: {
    default: 'Medical Devices Marketplace',
    template: '%s | Medical Devices Marketplace',
  },
  description: 'Leading marketplace for medical devices in the Middle East. Find diagnostic, surgical, and therapeutic equipment from verified suppliers.',
  keywords: ['medical devices', 'healthcare equipment', 'medical supplies', 'hospital equipment', 'أجهزة طبية', 'معدات طبية'],
  authors: [{ name: 'Medical Devices Team' }],
  creator: 'Medical Devices Marketplace',
  publisher: 'Medical Devices Marketplace',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://medical-devices.com'),
  openGraph: {
    title: 'Medical Devices Marketplace',
    description: 'Leading marketplace for medical devices in the Middle East',
    url: 'https://medical-devices.com',
    siteName: 'Medical Devices Marketplace',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Medical Devices Marketplace',
      },
    ],
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medical Devices Marketplace',
    description: 'Leading marketplace for medical devices in the Middle East',
    images: ['/twitter-image.jpg'],
    creator: '@medicaldevices',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://medical-devices.com',
    languages: {
      'en-US': 'https://medical-devices.com/en',
      'ar-SA': 'https://medical-devices.com/ar',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}