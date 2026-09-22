import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/components/booking/booking-flow';
import { Unavailable } from '@/components/landing/unavailable';
import { publicApi, safely } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Reservar cita',
  description: 'Elige servicio, profesional y hora. Sin crear cuenta.',
  alternates: { canonical: '/reservar' },
};

export default async function BookingPage() {
  const [business, catalog, team] = await Promise.all([
    safely(publicApi.business),
    safely(publicApi.catalog),
    safely(() => publicApi.professionals(undefined, 60)),
  ]);
  if (!business || !catalog) return <Unavailable />;

  return (
    <Suspense>
      <BookingFlow business={business} catalog={catalog} team={team ?? []} />
    </Suspense>
  );
}
