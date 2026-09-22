import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppointmentActions } from '@/components/booking/appointment-actions';
import { AppointmentChat } from '@/components/booking/appointment-chat';
import { PayButton } from '@/components/booking/pay-button';
import { Ticket } from '@/components/booking/ticket';
import { Unavailable } from '@/components/landing/unavailable';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiError, publicApi, safely } from '@/lib/api';
import { requireBusiness } from '@/lib/business-server';
import { siteHref } from '@/lib/site-paths';
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
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ nueva?: string; pago?: string; id?: string }>;
}) {
  const [{ slug, token }, { nueva, pago, id: transactionId }] = await Promise.all([
    params,
    searchParams,
  ]);
  const api = publicApi(slug);
  const business = await requireBusiness(slug);
  if (!business) return <Unavailable />;

  // Al volver de la pasarela: el servidor confirma el estado real con Wompi.
  let paymentResult: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | null = null;
  if (pago === '1' && transactionId && /^[\w-]{1,64}$/.test(transactionId)) {
    paymentResult = (await safely(() => api.verifyPayment(token, transactionId)))?.status ?? null;
  }

  let appointment;
  try {
    appointment = await api.appointment(token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    return <Unavailable />;
  }

  const a = appointment;
  const isNew = nueva === '1' && a.status !== 'CANCELLED';
  const firstName = a.customer.name.split(/\s+/)[0];
  const tz = a.timezone;

  const showPay =
    !!business.onlinePayments &&
    business.booking.paymentMode !== 'NONE' &&
    ['PENDING', 'CONFIRMED'].includes(a.status) &&
    !['PAID', 'REFUNDED'].includes(a.paymentStatus) &&
    paymentResult !== 'PAID';

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
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge status={a.status} />
          {a.paymentStatus === 'PAID' && (
            <span className="rounded-full bg-[#3F8F5B]/12 px-3 py-1 text-sm text-[#2F6E46]">
              Pagada
            </span>
          )}
        </div>
        {paymentResult && (
          <p
            role="status"
            className={`mt-6 rounded-xl border px-4 py-3 ${paymentResult === 'PAID' ? 'border-[#3F8F5B]/40 bg-[#3F8F5B]/[0.07]' : 'border-line bg-paper-2'}`}
          >
            {paymentResult === 'PAID'
              ? '¡Pago recibido! Gracias.'
              : paymentResult === 'PENDING'
                ? 'Tu pago está en proceso. Te avisaremos cuando se apruebe.'
                : 'El pago no se completó. Puedes intentarlo de nuevo.'}
          </p>
        )}
        <div className="mt-10">
          {a.status === 'CANCELLED' ? (
            <ButtonLink href={siteHref(slug, '/reservar')} size="lg">
              Reservar otra cita
            </ButtonLink>
          ) : (
            <AppointmentActions appointment={a} business={business} token={token} />
          )}
        </div>
        {showPay && (
          <div className="mt-10">
            <PayButton
              token={token}
              amountCents={a.priceCents}
              currency={a.currency}
              required={business.booking.paymentMode === 'REQUIRED'}
            />
          </div>
        )}
        {a.status !== 'CANCELLED' && (
          <div className="mt-10">
            <AppointmentChat token={token} businessName={business.name} timezone={tz} />
          </div>
        )}
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
