import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppointmentActions } from '@/components/booking/appointment-actions';
import { Ticket } from '@/components/booking/ticket';
import { Unavailable } from '@/components/landing/unavailable';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError, publicApi, safely } from '@/lib/api';
import { formatDuration, formatLongDate, formatMoney, formatTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tu cita',
  robots: { index: false, follow: false },
};

export default async function AppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const [{ token }, { nueva }] = await Promise.all([params, searchParams]);
  const business = await safely(publicApi.business);
  if (!business) return <Unavailable />;

  let appointment;
  try {
    appointment = await publicApi.appointment(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return <Unavailable />;
  }

  const a = appointment;
  const isNew = nueva === '1' && a.status !== 'CANCELLED';
  const firstName = a.customer.name.split(/\s+/)[0];
  const tz = a.timezone;

  const heading = isNew
    ? `Te esperamos, ${firstName}.`
    : a.status === 'CANCELLED'
      ? 'Cita cancelada'
      : 'Tu cita';
  const lead = isNew
    ? a.status === 'CONFIRMED'
      ? 'Tu cita está confirmada.'
      : `Recibimos tu reserva. ${business.name} la confirmará pronto.`
    : a.status === 'CANCELLED'
      ? 'Esta cita ya no está activa. Puedes reservar otra cuando quieras.'
      : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1fr_380px] md:pt-16">
      <div>
        <p className="eyebrow">{isNew ? 'Reserva recibida' : 'Mi cita'}</p>
        <h1 className="font-display mt-3 text-[clamp(2.4rem,6vw,4.2rem)] leading-[1] font-light tracking-[-0.03em]">
          {heading}
        </h1>
        {lead && <p className="text-stone mt-5 max-w-md text-lg">{lead}</p>}
        <div className="mt-6">
          <StatusBadge status={a.status} />
        </div>
        <div className="mt-10">
          {a.status === 'CANCELLED' ? (
            <ButtonLink href="/reservar" size="lg">
              Reservar otra cita
            </ButtonLink>
          ) : (
            <AppointmentActions appointment={a} business={business} token={token} />
          )}
        </div>
      </div>

      <Ticket
        printed={isNew}
        businessName={business.name}
        code={a.id.slice(0, 4).toUpperCase()}
        title={a.serviceName}
        rows={[
          {
            label: 'Fecha',
            value: (
              <span className="inline-block first-letter:uppercase">
                {formatLongDate(a.startsAt, tz)}
              </span>
            ),
          },
          { label: 'Hora', value: formatTime(a.startsAt, tz) },
          { label: 'Con', value: a.professional.name },
          { label: 'Duración', value: formatDuration(a.durationMinutes) },
          ...(business.address ? [{ label: 'Dónde', value: business.address }] : []),
        ]}
        total={{ label: 'Total a pagar en el local', value: formatMoney(a.priceCents, a.currency) }}
      />
    </div>
  );
}
