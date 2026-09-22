import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingFlow } from '@/components/booking/booking-flow';
import { Unavailable } from '@/components/landing/unavailable';
import { DemoNotice } from '@/components/platform/demo-notice';
import { isDemo } from '@/lib/demo';
import { publicApi, safely } from '@/lib/api';
import { requireBusiness } from '@/lib/business-server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Reservar cita',
  description: 'Elige servicio, profesional y hora. Sin crear cuenta.',
};

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const api = publicApi(slug);
  const [business, catalog, team] = await Promise.all([
    requireBusiness(slug),
    safely(api.catalog),
    safely(() => api.professionals(undefined, 60)),
  ]);
  if (!business || !catalog) return <Unavailable />;
  if (isDemo(slug)) return <DemoNotice style={business.style} />;

  return (
    <Suspense>
      <BookingFlow business={business} catalog={catalog} team={team ?? []} />
    </Suspense>
  );
}
