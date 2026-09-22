'use client';

import { useEffect, useRef } from 'react';
import { STATUS } from '@/components/ui/status-badge';
import { formatHhmm } from '@/lib/format';
import type { AdminAppointment } from '@/lib/admin/types';
import { hhmm, localMinute } from '@/lib/tz';

export const HOUR_PX = 64;
const SLOT_MIN = 30;

export interface GridColumn {
  key: string;
  label: string;
  sublabel?: string;
  /** Fecha local de la columna */
  date: string;
  professionalId?: string;
  /** Franjas de trabajo (minutos) para sombrear lo que no es laborable; undefined = no sombrear */
  workingRanges?: { start: number; end: number }[];
  appointments: AdminAppointment[];
  isToday?: boolean;
  color?: string;
}

/** Reparte citas que se cruzan en carriles lado a lado. */
function lanes(items: AdminAppointment[], tz: string) {
  const sorted = [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const out = new Map<string, { lane: number; lanes: number }>();
  let cluster: { id: string; lane: number }[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => {
    const n = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => out.set(c.id, { lane: c.lane, lanes: n }));
    cluster = [];
    laneEnds = [];
  };
  for (const a of sorted) {
    const s = localMinute(a.startsAt, tz);
    const e = s + a.durationMinutes;
    if (s >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = e;
    cluster.push({ id: a.id, lane });
    clusterEnd = Math.max(clusterEnd, e);
  }
  if (cluster.length) flush();
  return out;
}

/**
 * Cuadrícula de horas compartida por las vistas Día (columnas = profesionales)
 * y Semana (columnas = días). Tocar un hueco crea una cita ahí; tocar una cita la abre.
 */
export function TimeGrid({
  columns,
  startMin,
  endMin,
  timezone,
  canCreate,
  onSlotClick,
  onOpen,
  minColWidth = 150,
}: {
  columns: GridColumn[];
  startMin: number;
  endMin: number;
  timezone: string;
  canCreate: boolean;
  onSlotClick: (col: GridColumn, minute: number) => void;
  onOpen: (id: string) => void;
  minColWidth?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const height = ((endMin - startMin) / 60) * HOUR_PX;
  const hours = Array.from(
    { length: Math.ceil((endMin - startMin) / 60) },
    (_, i) => startMin + i * 60,
  );
  const slots = Array.from(
    { length: (endMin - startMin) / SLOT_MIN },
    (_, i) => startMin + i * SLOT_MIN,
  );
  const nowMin = localMinute(new Date(), timezone);
  const y = (min: number) => ((min - startMin) / 60) * HOUR_PX;

  // Al abrir, llevar la vista a la hora actual (o al inicio del día).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = columns.some((c) => c.isToday) ? Math.max(0, y(nowMin) - 120) : 0;
    el.scrollTop = target;
  }, [columns.length, startMin]);

  return (
    <div
      ref={scrollRef}
      className="border-line max-h-[calc(100dvh-230px)] min-h-[420px] overflow-auto rounded-2xl border"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(${minColWidth}px, 1fr))`,
        }}
      >
        {/* Encabezados */}
        <div className="border-line bg-paper sticky top-0 left-0 z-30 border-b" />
        {columns.map((c) => (
          <div
            key={c.key}
            className="border-line bg-paper sticky top-0 z-20 flex items-center gap-2 border-b border-l px-3 py-3"
          >
            {c.color && (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
            )}
            <div className="min-w-0">
              <p className={`truncate text-sm ${c.isToday ? 'text-ink font-medium' : ''}`}>
                {c.label}
              </p>
              {c.sublabel && <p className="text-stone truncate text-xs">{c.sublabel}</p>}
            </div>
          </div>
        ))}

        {/* Horas */}
        <div className="bg-paper sticky left-0 z-10" style={{ height }}>
          {hours.map((h) => (
            <span
              key={h}
              className="tabular text-stone absolute right-2 -translate-y-1/2 text-[11px]"
              style={{ top: y(h) }}
            >
              {h === startMin ? '' : formatHhmm(hhmm(h)).replace(':00', '')}
            </span>
          ))}
        </div>

        {columns.map((c) => {
          const layout = lanes(c.appointments, timezone);
          return (
            <div key={c.key} className="border-line relative border-l" style={{ height }}>
              {/* líneas de hora y media hora */}
              {hours.map((h) => (
                <div
                  key={h}
                  aria-hidden
                  className="border-line absolute inset-x-0 border-t"
                  style={{ top: y(h) }}
                />
              ))}
              {hours.map((h) => (
                <div
                  key={`m${h}`}
                  aria-hidden
                  className="border-line/60 absolute inset-x-0 border-t border-dashed"
                  style={{ top: y(h + 30) }}
                />
              ))}

              {/* fuera del horario del profesional */}
              {c.workingRanges &&
                offRanges(c.workingRanges, startMin, endMin).map((r) => (
                  <div
                    key={r.start}
                    aria-hidden
                    className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_srgb,var(--line)_55%,transparent)_6px_7px)]"
                    style={{ top: y(r.start), height: y(r.end) - y(r.start) }}
                  />
                ))}

              {/* huecos para crear cita */}
              {canCreate &&
                slots.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSlotClick(c, m)}
                    aria-label={`Nueva cita ${c.label} a las ${formatHhmm(hhmm(m))}`}
                    className="group hover:bg-paper-2/70 focus-visible:bg-paper-2 absolute inset-x-0 z-0"
                    style={{ top: y(m), height: (SLOT_MIN / 60) * HOUR_PX }}
                  >
                    <span className="text-stone hidden pl-2 text-left text-xs group-hover:block">
                      + {formatHhmm(hhmm(m))}
                    </span>
                  </button>
                ))}

              {/* ahora */}
              {c.isToday && nowMin >= startMin && nowMin <= endMin && (
                <div
                  aria-hidden
                  className="border-accent absolute inset-x-0 z-20 border-t-2"
                  style={{ top: y(nowMin) }}
                >
                  <span className="bg-accent absolute -top-[5px] -left-[5px] size-2 rounded-full" />
                </div>
              )}

              {/* citas */}
              {c.appointments.map((a) => {
                const s = localMinute(a.startsAt, timezone);
                const pos = layout.get(a.id) ?? { lane: 0, lanes: 1 };
                const h = Math.max((a.durationMinutes / 60) * HOUR_PX - 2, 22);
                const st = STATUS[a.status];
                const faded = a.status === 'CANCELLED' || a.status === 'NO_SHOW';
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onOpen(a.id)}
                    className={`border-line bg-paper absolute z-10 overflow-hidden rounded-lg border px-2 py-1 text-left shadow-[0_1px_0_rgb(0_0_0/0.04)] transition-shadow hover:shadow-md ${faded ? 'opacity-55' : ''}`}
                    style={{
                      top: y(s) + 1,
                      height: h,
                      left: `calc(${(pos.lane / pos.lanes) * 100}% + 3px)`,
                      width: `calc(${100 / pos.lanes}% - 6px)`,
                      borderLeft: `3px solid ${a.professional.color}`,
                    }}
                    aria-label={`${formatHhmm(hhmm(s))}, ${a.customer.name}, ${a.serviceNameSnapshot}, ${st.label}`}
                  >
                    <span className="text-stone flex items-center gap-1.5 text-[11px]">
                      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${st.dot}`} />
                      <span className="tabular">{formatHhmm(hhmm(s))}</span>
                    </span>
                    <span
                      className={`block truncate text-[13px] leading-tight ${a.status === 'CANCELLED' ? 'line-through' : ''}`}
                    >
                      {a.customer.name}
                    </span>
                    {h > 44 && (
                      <span className="text-stone block truncate text-[11px]">
                        {a.serviceNameSnapshot}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function offRanges(working: { start: number; end: number }[], startMin: number, endMin: number) {
  const sorted = [...working].sort((a, b) => a.start - b.start);
  const out: { start: number; end: number }[] = [];
  let cursor = startMin;
  for (const r of sorted) {
    if (r.start > cursor) out.push({ start: cursor, end: Math.min(r.start, endMin) });
    cursor = Math.max(cursor, r.end);
  }
  if (cursor < endMin) out.push({ start: cursor, end: endMin });
  return out.filter((r) => r.end > r.start);
}
