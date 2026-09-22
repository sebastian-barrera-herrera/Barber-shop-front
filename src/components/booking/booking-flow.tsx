'use client';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useSite } from '@/lib/site';
import { formatDuration, formatLongDate, formatMoney, formatTime } from '@/lib/format';
import type {
  BusinessProfile,
  CatalogGroup,
  PublicProfessional,
  PublicService,
  Slot,
} from '@/lib/types';
import { StepDetails, type CustomerDetails } from './step-details';
import { ANY, StepProfessional } from './step-professional';
import { StepService } from './step-service';
import { StepTime } from './step-time';
import { Ticket, type TicketRow } from './ticket';

type Step = 'service' | 'professional' | 'time' | 'details';
const STEPS: { key: Step; title: string }[] = [
  { key: 'service', title: '¿Qué servicio quieres?' },
  { key: 'professional', title: '¿Con quién?' },
  { key: 'time', title: '¿Cuándo?' },
  { key: 'details', title: 'Tus datos' },
];

/**
 * Flujo de reserva en 4 pantallas. La URL es la fuente de verdad
 * (?servicio=&con=&fecha=&hora=), así el botón "atrás" del teléfono funciona y se puede compartir.
 */
export function BookingFlow({
  business,
  catalog,
  team,
}: {
  business: BusinessProfile;
  catalog: CatalogGroup[];
  team: PublicProfessional[];
}) {
  const { api, href } = useSite();
  const params = useSearchParams();
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const services = useMemo(() => catalog.flatMap((g) => g.services), [catalog]);
  const service = services.find((s) => s.slug === params.get('servicio')) ?? null;
  const proParam = params.get('con');
  const professional = team.find((p) => p.slug === proParam) ?? null;
  const date = params.get('fecha');
  const startsAt = params.get('hora');

  const eligible = useMemo(
    () => (service ? team.filter((p) => p.services.some((s) => s.id === service.id)) : team),
    [service, team],
  );

  // Si vienen desde "Reservar con Carlos", la carta muestra solo lo que Carlos hace.
  const visibleCatalog = useMemo(() => {
    if (!professional) return catalog;
    const ids = new Set(professional.services.map((s) => s.id));
    return catalog
      .map((g) => ({ ...g, services: g.services.filter((s) => ids.has(s.id)) }))
      .filter((g) => g.services.length);
  }, [catalog, professional]);

  const step: Step = !service
    ? 'service'
    : !proParam || (proParam !== ANY && !eligible.some((p) => p.slug === proParam))
      ? 'professional'
      : !startsAt
        ? 'time'
        : 'details';
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const navigate = useCallback(
    (changes: Record<string, string | null>, replace = false) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      const url = `?${next.toString()}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    },
    [params],
  );

  // Un solo profesional posible: no preguntar.
  useEffect(() => {
    if (step === 'professional' && eligible.length === 1) navigate({ con: eligible[0].slug }, true);
  }, [step, eligible, navigate]);

  // Mover el foco al título al cambiar de paso (lectores de pantalla y teclado). No en la carga inicial.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const selectService = (s: PublicService) => {
    setNotice(null);
    const keepPro =
      proParam &&
      (proParam === ANY ||
        team.find((p) => p.slug === proParam)?.services.some((x) => x.id === s.id));
    navigate({ servicio: s.slug, con: keepPro ? proParam : null, fecha: null, hora: null });
  };

  const selectSlot = (slot: Slot) => {
    setNotice(null);
    setError(null);
    navigate({ hora: slot.startsAt });
  };

  const submit = async (details: CustomerDetails) => {
    if (!service || !startsAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const { manageToken } = await api.book({
        serviceId: service.id,
        professionalId: professional && proParam !== ANY ? professional.id : null,
        startsAt,
        customer: {
          name: details.name.trim(),
          phone: details.phone.trim(),
          email: details.email.trim() || undefined,
        },
        notes: details.notes.trim() || undefined,
      });
      router.push(`${href(`/cita/${manageToken}`)}?nueva=1`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No pudimos reservar. Intenta de nuevo';
      // La hora se ocupó mientras llenaba el formulario: volver a elegir hora con aviso.
      if (e instanceof ApiError && (e.status === 409 || /hora|fecha/i.test(message))) {
        setNotice(message);
        navigate({ hora: null });
      } else {
        setError(message);
      }
      setSubmitting(false);
    }
  };

  const tz = business.timezone;
  const rows: TicketRow[] = [];
  if (service)
    rows.push({
      label: 'Servicio',
      value: service.name,
      onChange: () => navigate({ servicio: null, fecha: null, hora: null }),
    });
  if (service && proParam && step !== 'professional') {
    rows.push({
      label: 'Con',
      value: proParam === ANY ? 'Primero disponible' : (professional?.name ?? ''),
      onChange: eligible.length > 1 ? () => navigate({ con: null, hora: null }) : undefined,
    });
  }
  if (startsAt) {
    rows.push({
      label: 'Cuándo',
      value: (
        <span className="inline-block first-letter:uppercase">
          {formatLongDate(startsAt, tz)} · {formatTime(startsAt, tz)}
        </span>
      ),
      onChange: () => navigate({ hora: null }),
    });
  }
  if (service) rows.push({ label: 'Duración', value: formatDuration(service.durationMinutes) });

  const ticket = (
    <Ticket
      businessName={business.name}
      title={service ? 'Tu cita' : 'Aún no eliges'}
      rows={
        rows.length ? rows : [{ label: 'Servicio', value: <span className="text-stone">—</span> }]
      }
      total={
        service
          ? { label: 'Total', value: formatMoney(service.priceCents, business.currency) }
          : undefined
      }
      footer={
        business.booking.cancellationWindowHours > 0
          ? `Puedes cancelar sin costo hasta ${business.booking.cancellationWindowHours} h antes.`
          : undefined
      }
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 md:pt-14">
        <div className="grid gap-10 md:grid-cols-[1fr_340px] md:gap-14">
          <div className="min-w-0">
            <nav aria-label="Progreso de la reserva" className="mb-6">
              <ol className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <li
                    key={s.key}
                    aria-current={i === stepIndex ? 'step' : undefined}
                    className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i <= stepIndex ? 'bg-ink' : 'bg-line'}`}
                  >
                    <span className="sr-only">
                      Paso {i + 1}: {s.title}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="eyebrow mt-3">
                Paso {stepIndex + 1} de {STEPS.length}
              </p>
            </nav>

            <h1
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-[clamp(2.2rem,5.5vw,3.6rem)] leading-[1] font-light tracking-[-0.025em] focus:outline-none"
            >
              {STEPS[stepIndex].title}
            </h1>

            {service && step !== 'details' && (
              <p className="text-stone mt-4 md:hidden">
                {service.name} · {formatMoney(service.priceCents, business.currency)}
                {professional && proParam !== ANY && step === 'time'
                  ? ` · con ${professional.name}`
                  : ''}
              </p>
            )}

            {notice && (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-[#C8912E]/50 bg-[#C8912E]/[0.08] px-4 py-3 text-sm"
              >
                {notice}
              </p>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8"
              >
                {step === 'service' && (
                  <>
                    {professional && (
                      <p className="text-stone -mt-2 mb-6">
                        Servicios que realiza {professional.name}.{' '}
                        <button
                          type="button"
                          className="underline underline-offset-2"
                          onClick={() => navigate({ con: null })}
                        >
                          Ver todos
                        </button>
                      </p>
                    )}
                    <StepService
                      groups={visibleCatalog}
                      currency={business.currency}
                      selectedSlug={service?.slug ?? null}
                      onSelect={selectService}
                    />
                  </>
                )}
                {step === 'professional' && service && (
                  <StepProfessional
                    professionals={eligible}
                    selected={proParam}
                    onSelect={(slug) => navigate({ con: slug, fecha: null, hora: null })}
                  />
                )}
                {step === 'time' && service && (
                  <StepTime
                    serviceId={service.id}
                    professionalId={proParam !== ANY ? professional?.id : undefined}
                    timezone={tz}
                    maxAdvanceDays={business.booking.maxAdvanceDays}
                    date={date}
                    onDate={(d, replace) => navigate({ fecha: d, hora: null }, replace)}
                    onSlot={selectSlot}
                  />
                )}
                {step === 'details' && (
                  <div className="grid gap-8">
                    <div className="md:hidden">{ticket}</div>
                    <StepDetails onSubmit={submit} submitting={submitting} error={error} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="hidden md:block" aria-label="Resumen de tu cita">
            <div className="sticky top-24">{ticket}</div>
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}
