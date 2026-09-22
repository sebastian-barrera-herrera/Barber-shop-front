'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AppointmentDrawer } from '@/components/admin/appointment-drawer';
import { Select, TextInput } from '@/components/admin/form';
import { NewAppointmentDrawer } from '@/components/admin/new-appointment-drawer';
import { EmptyState, PageHeader, PageShell } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { STATUS } from '@/components/ui/status-badge';
import { formatMoney } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import { useAppointment, useAppointmentList } from '@/lib/admin/hooks';
import { useBusiness, useProfessionals, useServices } from '@/lib/admin/queries';
import { localDate, shiftDays, zonedToUtc } from '@/lib/tz';

const RANGES = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'manana', label: 'Mañana' },
  { key: 'proximos', label: 'Próximos 7 días' },
  { key: 'pasados', label: 'Últimos 30 días' },
  { key: 'todas', label: 'Todas' },
] as const;

function CitasInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { canManage } = useAuth();
  const business = useBusiness();
  const professionals = useProfessionals();
  const services = useServices();
  const tz = business.data?.timezone ?? 'America/Bogota';
  const today = localDate(new Date(), tz);

  const range = (RANGES.find((r) => r.key === params.get('rango'))?.key ??
    'proximos') as (typeof RANGES)[number]['key'];
  const [q, setQ] = useState(params.get('q') ?? '');
  const [debounced, setDebounced] = useState(q);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const openId = params.get('id');

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) v ? next.set(k, v) : next.delete(k);
    router.replace(`/admin/citas?${next}`, { scroll: false });
    setPage(1);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const window = useMemo(() => {
    const at = (d: string) => zonedToUtc(d, 0, tz).toISOString();
    switch (range) {
      case 'hoy':
        return { from: at(today), to: at(shiftDays(today, 1)) };
      case 'manana':
        return { from: at(shiftDays(today, 1)), to: at(shiftDays(today, 2)) };
      case 'proximos':
        return { from: new Date().toISOString(), to: at(shiftDays(today, 8)) };
      case 'pasados':
        return { from: at(shiftDays(today, -30)), to: new Date().toISOString() };
      default:
        return {};
    }
  }, [range, today, tz]);

  const list = useAppointmentList({
    ...window,
    professionalId: params.get('pro') ?? undefined,
    status: params.get('estado') ?? undefined,
    serviceId: params.get('servicio') ?? undefined,
    q: debounced.length >= 2 ? debounced : undefined,
    page: String(page),
    pageSize: '50',
  });
  const items = list.data?.items ?? [];
  // En "pasados", lo más reciente primero.
  const rows = range === 'pasados' ? [...items].reverse() : items;
  const fromList = items.find((a) => a.id === openId) ?? null;
  const single = useAppointment(openId && !fromList ? openId : null);
  const open = fromList ?? single.data ?? null;

  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(iso));
  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(
      new Date(iso),
    );
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <PageShell>
      <PageHeader
        title="Citas"
        description="Busca, filtra y abre cualquier cita para confirmarla, moverla o cancelarla."
        action={
          canManage && business.data ? (
            <Button size="lg" onClick={() => setCreating(true)}>
              + Nueva cita
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Rango de fechas">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={range === r.key}
            onClick={() => set({ rango: r.key === 'proximos' ? null : r.key })}
            className="border-line text-stone aria-selected:border-ink aria-selected:bg-ink aria-selected:text-paper h-9 rounded-full border px-4 text-sm"
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="f-q" className="sr-only">
            Buscar
          </label>
          <TextInput
            id="f-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cliente, teléfono o servicio"
          />
        </div>
        <div>
          <label htmlFor="f-pro" className="sr-only">
            Profesional
          </label>
          <Select
            id="f-pro"
            value={params.get('pro') ?? ''}
            onChange={(e) => set({ pro: e.target.value || null })}
          >
            <option value="">Todo el equipo</option>
            {(professionals.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="f-st" className="sr-only">
            Estado
          </label>
          <Select
            id="f-st"
            value={params.get('estado') ?? ''}
            onChange={(e) => set({ estado: e.target.value || null })}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="f-svc" className="sr-only">
            Servicio
          </label>
          <Select
            id="f-svc"
            value={params.get('servicio') ?? ''}
            onChange={(e) => set({ servicio: e.target.value || null })}
          >
            <option value="">Todos los servicios</option>
            {(services.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="text-stone mt-5 text-sm" aria-live="polite">
        {list.data ? `${list.data.total} cita${list.data.total === 1 ? '' : 's'}` : 'Cargando…'}
      </p>

      <div className="mt-3">
        {list.data && !rows.length ? (
          <EmptyState
            title="No hay citas con estos filtros"
            body="Prueba con otro rango de fechas o quita algún filtro."
          />
        ) : (
          <ul className="divide-line border-line divide-y rounded-2xl border">
            {rows.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => set({ id: a.id })}
                  className="hover:bg-paper-2 grid w-full grid-cols-[5.5rem_1fr_auto] items-center gap-4 px-4 py-3.5 text-left md:grid-cols-[7rem_1.4fr_1fr_8rem_6rem]"
                >
                  <span>
                    <span className="text-stone block text-sm capitalize">
                      {fmtDay(a.startsAt)}
                    </span>
                    <span className="tabular block">{fmtTime(a.startsAt)}</span>
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate ${a.status === 'CANCELLED' ? 'text-stone line-through' : ''}`}
                    >
                      {a.customer.name}
                    </span>
                    <span className="text-stone block truncate text-sm">
                      {a.serviceNameSnapshot}
                      <span className="md:hidden"> · {a.professional.name}</span>
                    </span>
                  </span>
                  <span className="hidden items-center gap-2 text-sm md:flex">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ background: a.professional.color }}
                    />
                    {a.professional.name}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <span aria-hidden className={`size-2 rounded-full ${STATUS[a.status].dot}`} />
                    <span className="hidden sm:inline">{STATUS[a.status].label}</span>
                  </span>
                  <span className="tabular hidden text-right md:block">
                    {formatMoney(a.priceCents, business.data?.currency)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between text-sm">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Anteriores
          </Button>
          <span className="text-stone">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguientes →
          </Button>
        </nav>
      )}

      {business.data && (
        <>
          <AppointmentDrawer
            appointment={open}
            business={business.data}
            onClose={() => set({ id: null })}
          />
          <NewAppointmentDrawer
            open={creating}
            onClose={() => setCreating(false)}
            business={business.data}
          />
        </>
      )}
    </PageShell>
  );
}

export default function CitasPage() {
  return (
    <Suspense>
      <CitasInner />
    </Suspense>
  );
}
