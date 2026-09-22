import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk, Saira_Semi_Condensed, Yellowtail } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { PRESETS, themeStyle } from '@/lib/theme';
import './globals.css';

/* Estilo Spa ("la libreta"): serif editorial + grotesca. */
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

/* Estilo Barbería: condensada de letrero + manuscrita para los adornos. */
const condensed = Saira_Semi_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-saira',
  display: 'swap',
});

const script = Yellowtail({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PLATFORM} · Reservas en línea para barberías y spas`,
    template: `%s · ${PLATFORM}`,
  },
  description:
    'Tu página de reservas, tu agenda y tus clientes en un solo lugar. Para barberías, spas, salones y centros de belleza.',
  applicationName: PLATFORM,
  openGraph: { type: 'website', locale: 'es_CO', siteName: PLATFORM },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: PRESETS.studio.paper,
  width: 'device-width',
  initialScale: 1,
};

/**
 * Raíz neutra: carga las fuentes de los dos estilos. El tema real lo pone cada sección
 * (la página de la empresa, el panel o la landing de la plataforma).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${condensed.variable} ${script.variable}`}
      style={themeStyle(PRESETS.studio) as CSSProperties}
    >
      <body className="bg-paper text-ink min-h-dvh">{children}</body>
    </html>
  );
}
