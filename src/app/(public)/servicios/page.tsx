import type { Metadata } from 'next';
import { ServiceMenu } from '@/components/landing/service-menu';
import { Unavailable } from '@/components/landing/unavailable';
import { publicApi, safely } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Servicios y precios',
  description: 'Carta completa de servicios con precio y duración. Reserva en línea en un minuto.',
  alternates: { canonical: '/servicios' },
};

export default async function ServicesPage() {
  const [business, catalog] = await Promise.all([
    safely(publicApi.business),
    safely(publicApi.catalog),
  ]);
  if (!business) return <Unavailable />;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 md:pt-20">
      <p className="eyebrow">La carta</p>
      <h1 className="font-display mt-3 text-[clamp(2.6rem,7vw,5rem)] leading-[0.98] font-light tracking-[-0.03em]">
        Servicios y precios
      </h1>
      <p className="text-stone mt-5 max-w-xl text-lg">
        Precios finales. Toca un servicio para reservarlo.
      </p>
      <div className="mt-14">
        <ServiceMenu groups={catalog ?? []} currency={business.currency} />
      </div>
    </div>
  );
}
