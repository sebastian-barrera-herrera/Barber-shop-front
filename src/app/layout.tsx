import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { publicApi, safely } from '@/lib/api';
import { resolveTheme, themeStyle } from '@/lib/theme';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const business = await safely(publicApi.business);
  const name = business?.name ?? 'Studio';
  const description =
    business?.description ??
    business?.branding.heroSubtitle ??
    'Reserva tu cita de forma rápida y sencilla.';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${name} · Reserva tu cita`, template: `%s · ${name}` },
    description,
    applicationName: name,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: name,
      title: `${name} · Reserva tu cita`,
      description,
    },
    twitter: { card: 'summary_large_image' },
    formatDetection: { telephone: false },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const business = await safely(publicApi.business);
  return {
    themeColor: resolveTheme(business?.branding).paper,
    width: 'device-width',
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const business = await safely(publicApi.business);
  const theme = resolveTheme(business?.branding);

  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable}`}
      style={themeStyle(theme) as CSSProperties}
      data-preset={business?.branding.preset ?? 'studio'}
    >
      <body className="bg-paper text-ink min-h-dvh">{children}</body>
    </html>
  );
}
