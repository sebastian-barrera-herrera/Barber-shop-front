import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { Unavailable } from '@/components/landing/unavailable';
import { WhatsAppButton } from '@/components/landing/whatsapp-button';
import { loadBusiness, requireBusiness } from '@/lib/business-server';
import { SiteProvider } from '@/lib/site';
import { siteHref } from '@/lib/site-paths';
import { resolveTheme, themeCss } from '@/lib/theme';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await loadBusiness(slug);
  if (r.status !== 'ok') return { title: 'Reserva tu cita' };
  const b = r.business;
  const description = b.description ?? b.branding.heroSubtitle;
  return {
    // `absolute` evita que la plantilla de la plataforma le agregue su marca a la página del negocio.
    title: { absolute: `${b.name} · Reserva tu cita`, template: `%s · ${b.name}` },
    description,
    applicationName: b.name,
    alternates: { canonical: siteHref(slug) },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: b.name,
      title: `${b.name} · Reserva tu cita`,
      description,
    },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params;
  const r = await loadBusiness(slug);
  const b = r.status === 'ok' ? r.business : undefined;
  return { themeColor: resolveTheme(b?.branding, b?.style).paper };
}

/** Todo lo público de una empresa (filo.com/<slug>/…) con su estilo y su paleta. */
export default async function BusinessLayout({
  children,
  params,
}: Props & { children: ReactNode }) {
  const { slug } = await params;
  const business = await requireBusiness(slug);
  if (!business) return <Unavailable />;
  const theme = resolveTheme(business.branding, business.style);
  const whatsapp = business.whatsapp ?? business.social.whatsapp;

  return (
    <SiteProvider slug={business.slug} style={business.style}>
      <style>{themeCss(theme)}</style>
      <div data-site-style={business.style === 'BARBER' ? 'barber' : 'spa'} className="contents">
        <a
          href="#contenido"
          className="bg-ink text-paper sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <Navbar business={business} />
        <main id="contenido">{children}</main>
        <Footer business={business} />
        {whatsapp && <WhatsAppButton phone={whatsapp} businessName={business.name} />}
      </div>
    </SiteProvider>
  );
}
