'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Agenda } from '@/components/admin/agenda';
import { AppointmentDrawer } from '@/components/admin/appointment-drawer';
import { NewAppointmentDrawer } from '@/components/admin/new-appointment-drawer';
import { PopularServices } from '@/components/admin/popular-services';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { Button } from '@/components/ui/button';
import { formatLongDate, formatMoney } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import { useBusiness, useDashboard } from '@/lib/admin/queries';
import { localHour } from '@/lib/tz';

function greeting(hour: number) {
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export default function DashboardPage() {
  const { user, canManage } = useAuth();
  const business = useBusiness();
  const summary = useDashboard();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const tz = business.data?.timezone ?? 'America/Bogota';
  const s = summary.data;
  const currency = business.data?.currency ?? 'COP';
  const open = s?.agenda.find((a) => a.id === openId) ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow first-letter:uppercase">
            {s ? formatLongDate(`${s.date}T17:00:00Z`, 'UTC') : ' '}
          </p>
          <h1 className="font-display mt-2 text-[clamp(2.2rem,5vw,3.4rem)] leading-none font-light tracking-[-0.02em]">
            {greeting(localHour(tz))}, {user?.name.split(' ')[0]}
          </h1>
        </div>
        {canManage && business.data && (
          <Button size="lg" onClick={() => setCreating(true)}>
            + Nueva cita
          </Button>
        )}
      </header>

      {summary.isError && (
        <p role="alert" className="border-line bg-paper-2 mt-8 rounded-xl border px-4 py-3">
          No pudimos cargar el resumen. {summary.error.message}
        </p>
      )}

      <section
        aria-label="Resumen de hoy"
        className="border-line bg-line mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border lg:grid-cols-4"
      >
        <Stat
          label="Citas hoy"
          value={s ? String(s.today.appointments) : '—'}
          detail={s ? `${s.today.completed} completadas` : undefined}
        />
        <Stat
          label="Ingresos del día"
          value={s ? formatMoney(s.today.revenueCents, currency) : '—'}
          detail={
            s ? `de ${formatMoney(s.today.expectedRevenueCents, currency)} agendados` : undefined
          }
        />
        <Stat
          label="Por confirmar"
          value={s ? String(s.today.pending) : '—'}
          detail={s?.today.pending ? 'Confírmalas abajo' : 'Todo al día'}
          highlight={!!s?.today.pending}
        />
        <Stat
          label="Clientes nuevos"
          value={s ? String(s.today.newCustomers) : '—'}
          detail={s ? `${s.activeProfessionals} profesionales activos` : undefined}
        />
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="agenda-title">
          <div className="border-ink/80 mb-2 flex items-baseline justify-between border-b pb-3">
            <h2 id="agenda-title" className="font-display text-2xl">
              Agenda de hoy
            </h2>
            <Link
              href="/admin/calendario"
              className="text-stone hover:text-ink text-sm underline-offset-2 hover:underline"
            >
              Ver calendario
            </Link>
          </div>
          {s ? (
            <Agenda items={s.agenda} timezone={tz} onOpen={setOpenId} />
          ) : (
            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-paper-2 h-20 animate-pulse rounded-xl" />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-12">
          <section aria-labelledby="rev-title">
            <div className="border-ink/80 mb-5 flex items-baseline justify-between border-b pb-3">
              <h2 id="rev-title" className="font-display text-2xl">
                Ingresos
              </h2>
              <span className="text-stone text-sm">últimos 7 días</span>
            </div>
            {s && <RevenueChart data={s.revenueByDay} currency={currency} today={s.date} />}
            {s && (
              <p className="text-stone mt-3 text-sm">
                Total semana:{' '}
                <span className="tabular text-ink">
                  {formatMoney(
                    s.revenueByDay.reduce((n, d) => n + d.revenueCents, 0),
                    currency,
                  )}
                </span>
              </p>
            )}
          </section>

          <section aria-labelledby="pop-title">
            <div className="border-ink/80 mb-5 flex items-baseline justify-between border-b pb-3">
              <h2 id="pop-title" className="font-display text-2xl">
                Servicios populares
              </h2>
              <span className="text-stone text-sm">30 días</span>
            </div>
            {s && <PopularServices items={s.popularServices} />}
          </section>
        </div>
      </div>

      {business.data && (
        <>
          <AppointmentDrawer
            appointment={open}
            business={business.data}
            onClose={() => setOpenId(null)}
          />
          <NewAppointmentDrawer
            open={creating}
            onClose={() => setCreating(false)}
            business={business.data}
          />
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  detail,
  highlight,
}: {
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-paper p-5 md:p-6">
      <p className="text-stone text-sm">{label}</p>
      <p
        className={`tabular font-display mt-2 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-none ${highlight ? 'text-accent' : ''}`}
      >
        {value}
      </p>
      {detail && <p className="text-stone mt-2 text-xs">{detail}</p>}
    </div>
  );
}
