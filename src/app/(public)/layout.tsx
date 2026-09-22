import type { ReactNode } from 'react';
import { Footer } from '@/components/landing/footer';
import { Navbar } from '@/components/landing/navbar';
import { Unavailable } from '@/components/landing/unavailable';
import { WhatsAppButton } from '@/components/landing/whatsapp-button';
import { publicApi, safely } from '@/lib/api';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const business = await safely(publicApi.business);
  if (!business) return <Unavailable />;
  const whatsapp = business.whatsapp ?? business.social.whatsapp;

  return (
    <>
      <a
        href="#contenido"
        className="bg-ink text-paper sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <Navbar name={business.name} />
      <main id="contenido">{children}</main>
      <Footer business={business} />
      {whatsapp && <WhatsAppButton phone={whatsapp} businessName={business.name} />}
    </>
  );
}
