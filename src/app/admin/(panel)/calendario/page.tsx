'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { AppointmentDrawer } from '@/components/admin/appointment-drawer';
import { MonthGrid } from '@/components/admin/calendar/month-grid';
import { TimeGrid, type GridColumn } from '@/components/admin/calendar/time-grid';
import { Select } from '@/components/admin/form';
import {
  NewAppointmentDrawer,
  type NewAppointmentPrefill,
} from '@/components/admin/new-appointment-drawer';
import { Button } from '@/components/ui/button';
import { STATUS } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/admin/auth';
import { useAppointments, useBusiness, useProfessionals } from '@/lib/admin/queries';
import type { AdminBusiness, AdminProfessional } from '@/lib/admin/types';
import {
  localDate,
  monthGrid,
  shiftDays,
  shiftMonths,
  startOfWeek,
  toMinutes,
  weekday,
  zonedToUtc,
} from '@/lib/tz';

type View = 'dia' | 'semana' | 'mes';
const VIEWS: { key: View; label: string }[] = [
  { key: 'dia', label: 'Día' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
];

const fmt = (date: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', { ...o, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

/** Rango de horas visible: del primer horario de apertura al último cierre (en punto). */
function visibleHours(business: AdminBusiness, professionals: AdminProfessional[]) {
  const opens = business.settings.openingHours.filter((d) => !d.closed);
  const ranges = professionals.flatMap((p) => p.workingHours.flatMap((d) => d.ranges));
  const starts = [...opens.map((d) => toMinutes(d.open)), ...ranges.map((r) => toMinutes(r.start))];
  const ends = [...opens.map((d) => toMinutes(d.close)), ...ranges.map((r) => toMinutes(r.end))];
  const start = starts.length ? Math.floor(Math.min(...starts) / 60) * 60 : 8 * 60;
  const end = ends.length ? Math.ceil(Math.max(...ends) / 60) * 60 : 20 * 60;
  return { start: Math.max(0, start - 60), end: Math.min(24 * 60, end + 60) };
}

function workingFor(p: AdminProfessional | undefined, date: string) {
  if (!p) return undefined;
  return (p.workingHours.find((d) => d.weekday === weekday(date))?.ranges ?? []).map((r) => ({
    start: toMinutes(r.start),
    end: toMinutes(r.end),
  }));
}

function CalendarInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, canManage } = useAuth();
  const business = useBusiness();
  const professionals = useProfessionals();
  const tz = business.data?.timezone ?? 'America/Bogota';
  const today = localDate(new Date(), tz);

  const view = (VIEWS.find((v) => v.key === params.get('vista'))?.key ?? 'dia') as View;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('fecha') ?? '') ? params.get('fecha')! : today;
  const proFilter = params.get('pro') ?? '';
  const [showCancelled, setShowCancelled] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<NewAppointmentPrefill | null>(null);

  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) v ? next.set(k, v) : next.delete(k);
    router.replace(`/admin/calendario?${next}`, { scroll: false });
  };

  // Rango a cargar según la vista.
  const [from, to] = useMemo(() => {
    if (view === 'dia') return [date, shiftDays(date, 1)];
    if (view === 'semana') {
      const s = startOfWeek(date);
      return [s, shiftDays(s, 7)];
    }
    const grid = monthGrid(date);
    return [grid[0], shiftDays(grid[41], 1)];
  }, [view, date]);

  const appts = useAppointments(
    zonedToUtc(from, 0, tz).toISOString(),
    zonedToUtc(to, 0, tz).toISOString(),
    view !== 'dia' && proFilter ? proFilter : undefined,
  );
  const all = appts.data ?? [];
  const visible = showCancelled ? all : all.filter((a) => a.status !== 'CANCELLED');
  const open = all.find((a) => a.id === openId) ?? null;

  // El profesional solo ve su columna.
  const team = (professionals.data ?? []).filter(
    (p) => !user?.professionalId || p.id === user.professionalId,
  );

  const step = (dir: 1 | -1) =>
    go({
      fecha:
        view === 'dia'
          ? shiftDays(date, dir)
          : view === 'semana'
            ? shiftDays(date, 7 * dir)
            : shiftMonths(date, dir),
    });

  const title =
    view === 'dia'
      ? fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })
      : view === 'semana'
        ? `${fmt(startOfWeek(date), { day: 'numeric', month: 'short' })} – ${fmt(shiftDays(startOfWeek(date), 6), { day: 'numeric', month: 'short' })}`
        : fmt(date, { month: 'long', year: 'numeric' });

  if (!business.data || !professionals.data) {
    return <div className="bg-paper-2 h-[60vh] animate-pulse rounded-2xl" />;
  }
  const hours = visibleHours(business.data, team);

  let columns: GridColumn[] = [];
  if (view === 'dia') {
    columns = team.map((p) => ({
      key: p.id,
      label: p.name,
      sublabel: p.title ?? undefined,
      color: p.color,
      date,
      professionalId: p.id,
      isToday: date === today,
      workingRanges: workingFor(p, date),
      appointments: visible.filter(
        (a) => a.professional.id === p.id && localDate(a.startsAt, tz) === date,
      ),
    }));
  } else if (view === 'semana') {
    const selected = team.find((p) => p.id === proFilter);
    columns = Array.from({ length: 7 }, (_, i) => {
      const d = shiftDays(startOfWeek(date), i);
      return {
        key: d,
        label: fmt(d, { weekday: 'short', day: 'numeric' }),
        date: d,
        professionalId: selected?.id,
        isToday: d === today,
        workingRanges: selected ? workingFor(selected, d) : undefined,
        appointments: visible.filter((a) => localDate(a.startsAt, tz) === d),
      };
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Anterior"
            className="hover:bg-paper-2 flex size-10 items-center justify-center rounded-full"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path
                d="M12.5 4 6.5 10l6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Siguiente"
            className="hover:bg-paper-2 flex size-10 items-center justify-center rounded-full"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path
                d="m7.5 4 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Button variant="secondary" onClick={() => go({ fecha: null })} className="h-10 px-4">
            Hoy
          </Button>
        </div>
        <h2 aria-live="polite" className="font-display mr-auto text-2xl first-letter:uppercase">
          {title}
        </h2>

        <div role="tablist" aria-label="Vista" className="border-line flex rounded-full border p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => go({ vista: v.key === 'dia' ? null : v.key })}
              className="text-stone aria-selected:bg-ink aria-selected:text-paper h-8 rounded-full px-4 text-sm"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        {view !== 'dia' && team.length > 1 && (
          <div className="w-52">
            <label htmlFor="cal-pro" className="sr-only">
              Profesional
            </label>
            <Select
              id="cal-pro"
              value={proFilter}
              onChange={(e) => go({ pro: e.target.value || null })}
              className="h-10"
            >
              <option value="">Todo el equipo</option>
              {team.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <label className="text-stone flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            className="size-4 accent-[var(--ink)]"
          />
          Mostrar canceladas
        </label>
        <ul className="text-stone flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Estados">
          {(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'] as const).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span aria-hidden className={`size-1.5 rounded-full ${STATUS[s].dot}`} />
              {STATUS[s].label}
            </li>
          ))}
        </ul>
        {appts.isFetching && <span className="text-stone text-xs">Actualizando…</span>}
      </div>

      <div className="mt-5">
        {view === 'mes' ? (
          <MonthGrid
            date={date}
            today={today}
            appointments={visible}
            timezone={tz}
            onDay={(d) => go({ vista: null, fecha: d })}
          />
        ) : team.length === 0 ? (
          <p className="border-line text-stone rounded-2xl border border-dashed px-6 py-10 text-center">
            Agrega un profesional para empezar a usar el calendario.
          </p>
        ) : (
          <TimeGrid
            columns={columns}
            startMin={hours.start}
            endMin={hours.end}
            timezone={tz}
            canCreate={canManage}
            minColWidth={view === 'semana' ? 120 : 160}
            onOpen={setOpenId}
            onSlotClick={(col, minute) =>
              setPrefill({ date: col.date, minute, professionalId: col.professionalId })
            }
          />
        )}
      </div>

      <AppointmentDrawer
        appointment={open}
        business={business.data}
        onClose={() => setOpenId(null)}
      />
      <NewAppointmentDrawer
        open={!!prefill}
        onClose={() => setPrefill(null)}
        business={business.data}
        prefill={prefill ?? undefined}
      />
    </>
  );
}

export default function CalendarPage() {
  const { canManage } = useAuth();
  const business = useBusiness();
  const [creating, setCreating] = useState(false);

  return (
    <main className="px-4 py-8 sm:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-none font-light tracking-[-0.02em]">
          Calendario
        </h1>
        {canManage && business.data && (
          <Button size="lg" onClick={() => setCreating(true)}>
            + Nueva cita
          </Button>
        )}
      </header>
      <Suspense>
        <CalendarInner />
      </Suspense>
      {business.data && (
        <NewAppointmentDrawer
          open={creating}
          onClose={() => setCreating(false)}
          business={business.data}
        />
      )}
    </main>
  );
}
