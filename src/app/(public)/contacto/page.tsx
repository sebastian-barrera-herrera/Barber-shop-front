import type { Metadata } from 'next';
import { Unavailable } from '@/components/landing/unavailable';
import { Visit } from '@/components/landing/visit';
import { publicApi, safely } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Horario y ubicación',
  description: 'Dirección, horario de atención y formas de contacto.',
  alternates: { canonical: '/contacto' },
};

export default async function ContactPage() {
  const business = await safely(publicApi.business);
  if (!business) return <Unavailable />;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 md:pt-20">
      <p className="eyebrow">Visítanos</p>
      <h1 className="font-display mt-3 text-[clamp(2.6rem,7vw,5rem)] leading-[0.98] font-light tracking-[-0.03em]">
        Horario y ubicación
      </h1>
      <div className="mt-14">
        <Visit business={business} />
      </div>
    </div>
  );
}
