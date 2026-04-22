/**
 * Root Layout
 * Estructura base de la aplicación con Header y Footer
 * Responsive: mobile → 4K
 * Accesibilidad: SkipLink, LiveAnnouncer, focus management
 */
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import PayPalProvider from '@/components/providers/PayPalProvider';
import { CartPersistenceProvider } from '@/components/providers/CartPersistenceProvider';
import { SiteConfigProvider } from '@/providers/SiteConfigProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SkipLink } from '@/components/a11y/SkipLink';
import { AnnouncerRegion } from '@/components/a11y/LiveAnnouncer';

// Import ClientOnly wrapper for client-only components
import { ClientOnly } from '@/components/providers/ClientOnly';
import { NetworkIndicator } from '@/components/ui/NetworkIndicator';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '3D Print - Impresión 3D',
  description: 'E-commerce de productos impresos en 3D de alta calidad.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '3D Print TFM',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <QueryProvider>
          <SessionProvider>
            <PayPalProvider>
              <CartPersistenceProvider>
                <SiteConfigProvider>
                  {/* Global Toast Notifications */}
                  <ToastProvider />

                  {/* Accessibility: Skip link for keyboard navigation */}
                  <SkipLink />

                  {/* Indicador de estado de red (client-only) */}
                  <ClientOnly>
                    <NetworkIndicator />
                  </ClientOnly>

                  {/* Registro del Service Worker (client-only) */}
                  <ClientOnly>
                    <ServiceWorkerRegistration />
                  </ClientOnly>

                  <Header />

                  {/* Main Content Area - Skip link target */}
                  <main id="main-content" className="flex-grow" tabIndex={-1}>
                    {children}
                  </main>

                  <Footer />

                  {/* Accessibility: Live region for screen reader announcements */}
                  <AnnouncerRegion />
                </SiteConfigProvider>
              </CartPersistenceProvider>
            </PayPalProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
