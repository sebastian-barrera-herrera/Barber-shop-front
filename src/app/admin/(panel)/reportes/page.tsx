'use client';

import { useMemo, useState } from 'react';
import { TextInput } from '@/components/admin/form';
import { NoAccess, PageHeader, PageShell } from '@/components/admin/page-header';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { formatMoney } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import { useReport } from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';
import { localDate, shiftDays, shiftMonths } from '@/lib/tz';

type Preset = '7' | '30' | 'mes' | 'anterior' | 'custom';

export default function ReportesPage() {
  const { canManage } = useAuth();
  const business = useBusiness();
  const tz = business.data?.timezone ?? 'America/Bogota';
  const currency = business.data?.currency ?? 'COP';
  const today = localDate(new Date(), tz);
  const [preset, setPreset] = useState<Preset>('30');
  const [custom, setCustom] = useState({ from: shiftDays(today, -13), to: today });

  const { from, to } = useMemo(() => {
    switch (preset) {
      case '7':
        return { from: shiftDays(today, -6), to: today };
      case '30':
        return { from: shiftDays(today, -29), to: today };
      case 'mes':
        return { from: `${today.slice(0, 8)}01`, to: today };
      case 'anterior': {
        const first = shiftMonths(today, -1);
        return { from: first, to: shiftDays(`${today.slice(0, 8)}01`, -1) };
      }
      default:
        return custom;
    }
  }, [preset, today, custom]);

  const report = useReport(from, to);
  if (!canManage) return <NoAccess who="el dueño o el administrador" />;
  const r = report.data;
  const maxService = Math.max(1, ...(r?.topServices.map((s) => s.count) ?? []));
  const maxPro = Math.max(1, ...(r?.topProfessionals.map((p) => p.completed) ?? []));

  const PRESETS: { key: Preset; label: string }[] = [
    { key: '7', label: 'Últimos 7 días' },
    { key: '30', label: 'Últimos 30 días' },
    { key: 'mes', label: 'Este mes' },
    { key: 'anterior', label: 'Mes pasado' },
    { key: 'custom', label: 'Otras fechas' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Reportes"
        description="Cómo va el negocio: citas, ingresos y lo que más se pide."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Periodo">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={preset === p.key}
            onClick={() => setPreset(p.key)}
            className="border-line text-stone aria-selected:border-ink aria-selected:bg-ink aria-selected:text-paper h-9 rounded-full border px-4 text-sm"
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="r-from" className="sr-only">
            Desde
          </label>
          <TextInput
            id="r-from"
            type="date"
            value={custom.from}
            max={custom.to}
            onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            className="w-44"
          />
          <span className="text-stone">a</span>
          <label htmlFor="r-to" className="sr-only">
            Hasta
          </label>
          <TextInput
            id="r-to"
            type="date"
            value={custom.to}
            min={custom.from}
            onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            className="w-44"
          />
        </div>
      )}
      {report.isError && (
        <p role="alert" className="mt-4 text-sm text-[#A5473F]">
          {report.error.message}
        </p>
      )}

      <section
        aria-label="Totales"
        className="border-line bg-line mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border lg:grid-cols-4"
      >
        {[
          [
            'Ingresos',
            r ? formatMoney(r.totals.revenueCents, currency) : '—',
            r ? `Ticket promedio ${formatMoney(r.totals.averageTicketCents, currency)}` : '',
          ],
          [
            'Citas realizadas',
            r ? String(r.totals.completed) : '—',
            r ? `de ${r.totals.appointments} agendadas` : '',
          ],
          [
            'Canceladas',
            r ? String(r.totals.cancelled) : '—',
            r ? `${r.totals.noShow} no asistieron` : '',
          ],
          [
            'Tasa de cancelación',
            r ? `${r.totals.cancellationRate}%` : '—',
            'incluye "no asistió"',
          ],
        ].map(([label, value, detail]) => (
          <div key={label} className="bg-paper p-5 md:p-6">
            <p className="text-stone text-sm">{label}</p>
            <p className="tabular font-display mt-2 text-[clamp(1.6rem,3vw,2.4rem)] leading-none">
              {value}
            </p>
            <p className="text-stone mt-2 text-xs">{detail}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="r-rev" className="mt-12">
        <h2 id="r-rev" className="border-ink/80 font-display mb-5 border-b pb-3 text-2xl">
          Ingresos por día
        </h2>
        {r && <RevenueChart data={r.byDay} currency={currency} today={today} />}
      </section>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <section aria-labelledby="r-svc">
          <h2 id="r-svc" className="border-ink/80 font-display mb-5 border-b pb-3 text-2xl">
            Servicios más reservados
          </h2>
          {r && !r.topServices.length && (
            <p className="text-stone text-sm">Sin datos en este periodo.</p>
          )}
          <ol className="space-y-3.5">
            {r?.topServices.map((s) => (
              <li key={s.name}>
                <div className="flex justify-between gap-3 text-[0.95rem]">
                  <span>{s.name}</span>
                  <span className="tabular text-stone">
                    {s.count} · {formatMoney(s.revenueCents, currency)}
                  </span>
                </div>
                <div className="bg-line/60 mt-1.5 h-1.5 rounded-full">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${(s.count / maxService) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="r-pro">
          <h2 id="r-pro" className="border-ink/80 font-display mb-5 border-b pb-3 text-2xl">
            Profesionales con más citas
          </h2>
          {r && !r.topProfessionals.length && (
            <p className="text-stone text-sm">Sin citas realizadas en este periodo.</p>
          )}
          <ol className="space-y-3.5">
            {r?.topProfessionals.map((p) => (
              <li key={p.professionalId}>
                <div className="flex justify-between gap-3 text-[0.95rem]">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ background: p.color }}
                    />
                    {p.name}
                  </span>
                  <span className="tabular text-stone">
                    {p.completed} · {formatMoney(p.revenueCents, currency)}
                  </span>
                </div>
                <div className="bg-line/60 mt-1.5 h-1.5 rounded-full">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${(p.completed / maxPro) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageShell>
  );
}
