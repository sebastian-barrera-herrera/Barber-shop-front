'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { STATUS } from '@/components/ui/status-badge';
import { formatHhmm } from '@/lib/format';
import type { AdminAppointment } from '@/lib/admin/types';
import { hhmm, localMinute } from '@/lib/tz';

export const HOUR_PX = 64;
const SLOT_MIN = 30;
const DRAG_THRESHOLD_PX = 4;
const EDGE_PX = 48;

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

interface DragState {
  id: string;
  appt: AdminAppointment;
  startX: number;
  startY: number;
  /** Minutos entre el inicio de la cita y el punto donde se agarró */
  grabOffsetMin: number;
  originCol: number;
  originMinute: number;
  col: number;
  minute: number;
  active: boolean;
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
 * y Semana (columnas = días). Tocar un hueco crea una cita; tocar una cita la abre;
 * con mouse, arrastrarla la mueve (el teclado y el móvil usan "Mover cita" en el detalle).
 */
export function TimeGrid({
  columns,
  startMin,
  endMin,
  timezone,
  canCreate,
  onSlotClick,
  onOpen,
  onMove,
  canDrag = () => false,
  stepMinutes = 15,
  minColWidth = 150,
}: {
  columns: GridColumn[];
  startMin: number;
  endMin: number;
  timezone: string;
  canCreate: boolean;
  onSlotClick: (col: GridColumn, minute: number) => void;
  onOpen: (id: string) => void;
  /** Mover una cita a otra columna/hora. Debe resolver o rechazar cuando el servidor responda. */
  onMove?: (appointment: AdminAppointment, column: GridColumn, minute: number) => Promise<void>;
  canDrag?: (appointment: AdminAppointment) => boolean;
  stepMinutes?: number;
  minColWidth?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pending, setPending] = useState<{ id: string; col: number; minute: number } | null>(null);

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
    el.scrollTop = columns.some((c) => c.isToday) ? Math.max(0, y(nowMin) - 120) : 0;
  }, [columns.length, startMin]);

  // Esc cancela el arrastre.
  useEffect(() => {
    if (!drag) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dragRef.current = null;
        setDrag(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drag]);

  // ───────────── arrastre ─────────────

  const locate = (clientX: number, clientY: number, d: DragState) => {
    const rects = colRefs.current.map((el) => el?.getBoundingClientRect());
    let col = rects.findIndex((r) => r && clientX >= r.left && clientX < r.right);
    if (col === -1) {
      const first = rects[0];
      col = first && clientX < first.left ? 0 : rects.length - 1;
    }
    const rect = rects[col] ?? rects[d.originCol];
    if (!rect) return { col: d.col, minute: d.minute };
    const raw = ((clientY - rect.top) / HOUR_PX) * 60 + startMin - d.grabOffsetMin;
    const snapped = Math.round(raw / stepMinutes) * stepMinutes;
    const minute = Math.min(Math.max(snapped, startMin), endMin - d.appt.durationMinutes);
    return { col, minute };
  };

  const onPointerDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    a: AdminAppointment,
    colIndex: number,
  ) => {
    if (!onMove || !canDrag(a) || pending || e.button !== 0 || e.pointerType === 'touch') return;
    const start = localMinute(a.startsAt, timezone);
    const blockTop = e.currentTarget.getBoundingClientRect().top;
    const state: DragState = {
      id: a.id,
      appt: a,
      startX: e.clientX,
      startY: e.clientY,
      grabOffsetMin: ((e.clientY - blockTop) / HOUR_PX) * 60,
      originCol: colIndex,
      originMinute: start,
      col: colIndex,
      minute: start,
      active: false,
    };
    dragRef.current = state;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.active && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD_PX)
      return;

    // Desplazar el calendario al acercarse al borde.
    const box = scrollRef.current?.getBoundingClientRect();
    if (box && scrollRef.current) {
      if (e.clientY < box.top + EDGE_PX) scrollRef.current.scrollTop -= 14;
      else if (e.clientY > box.bottom - EDGE_PX) scrollRef.current.scrollTop += 14;
      if (e.clientX < box.left + EDGE_PX + 56) scrollRef.current.scrollLeft -= 14;
      else if (e.clientX > box.right - EDGE_PX) scrollRef.current.scrollLeft += 14;
    }

    const next = { ...d, active: true, ...locate(e.clientX, e.clientY, d) };
    dragRef.current = next;
    setDrag(next);
  };

  const onPointerUp = async (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d?.active) return; // fue un clic: lo maneja onClick
    suppressClick.current = true;
    setDrag(null);
    if (d.col === d.originCol && d.minute === d.originMinute) return;
    setPending({ id: d.id, col: d.col, minute: d.minute });
    try {
      await onMove?.(d.appt, columns[d.col], d.minute);
    } catch {
      /* el aviso de error lo muestra la página; la cita vuelve a su lugar */
    } finally {
      setPending(null);
    }
  };

  // ───────────── pintado ─────────────

  const block = (
    a: AdminAppointment,
    minute: number,
    lane: { lane: number; lanes: number },
    variant: 'normal' | 'origin' | 'ghost' | 'pending',
    colIndex: number,
  ) => {
    const h = Math.max((a.durationMinutes / 60) * HOUR_PX - 2, 22);
    const st = STATUS[a.status];
    const faded = a.status === 'CANCELLED' || a.status === 'NO_SHOW';
    const draggable = !!onMove && canDrag(a);
    const common = {
      top: y(minute) + 1,
      height: h,
      left: `calc(${(lane.lane / lane.lanes) * 100}% + 3px)`,
      width: `calc(${100 / lane.lanes}% - 6px)`,
      borderLeft: `3px solid ${a.professional.color}`,
    };
    const content = (
      <>
        <span className="text-stone flex items-center gap-1.5 text-[11px]">
          <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${st.dot}`} />
          <span className="tabular">{formatHhmm(hhmm(minute))}</span>
          {variant === 'pending' && <span>· moviendo…</span>}
        </span>
        <span
          className={`block truncate text-[13px] leading-tight ${a.status === 'CANCELLED' ? 'line-through' : ''}`}
        >
          {a.customer.name}
        </span>
        {h > 44 && (
          <span className="text-stone block truncate text-[11px]">{a.serviceNameSnapshot}</span>
        )}
      </>
    );

    if (variant === 'ghost') {
      return (
        <div
          key={`ghost-${a.id}`}
          aria-hidden
          className="border-ink bg-paper-2 pointer-events-none absolute z-30 overflow-hidden rounded-lg border border-dashed px-2 py-1 shadow-lg"
          style={{ ...common, left: '3px', width: 'calc(100% - 6px)' }}
        >
          {content}
        </div>
      );
    }

    return (
      <button
        key={a.id}
        type="button"
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          onOpen(a.id);
        }}
        onPointerDown={(e) => onPointerDown(e, a, colIndex)}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => void onPointerUp(e)}
        onPointerCancel={() => {
          dragRef.current = null;
          setDrag(null);
        }}
        title={draggable ? 'Arrastra para mover · clic para ver' : undefined}
        className={`border-line bg-paper absolute z-10 overflow-hidden rounded-lg border px-2 py-1 text-left shadow-[0_1px_0_rgb(0_0_0/0.04)] transition-shadow hover:shadow-md ${
          draggable ? 'cursor-grab active:cursor-grabbing' : ''
        } ${faded ? 'opacity-55' : ''} ${variant === 'origin' ? 'opacity-35' : ''} ${variant === 'pending' ? 'animate-pulse opacity-70' : ''}`}
        style={{ ...common, touchAction: draggable ? 'pan-y' : undefined }}
        aria-label={`${formatHhmm(hhmm(minute))}, ${a.customer.name}, ${a.serviceNameSnapshot}, ${st.label}`}
      >
        {content}
      </button>
    );
  };

  const offRanges = (working: { start: number; end: number }[]) => {
    const sorted = [...working].sort((a, b) => a.start - b.start);
    const out: { start: number; end: number }[] = [];
    let cursor = startMin;
    for (const r of sorted) {
      if (r.start > cursor) out.push({ start: cursor, end: Math.min(r.start, endMin) });
      cursor = Math.max(cursor, r.end);
    }
    if (cursor < endMin) out.push({ start: cursor, end: endMin });
    return out.filter((r) => r.end > r.start);
  };

  return (
    <div
      ref={scrollRef}
      className={`border-line max-h-[calc(100dvh-230px)] min-h-[420px] overflow-auto rounded-2xl border ${drag ? 'select-none' : ''}`}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(${minColWidth}px, 1fr))`,
        }}
      >
        {/* Encabezados */}
        <div className="border-line bg-paper sticky top-0 left-0 z-40 border-b" />
        {columns.map((c, i) => (
          <div
            key={c.key}
            className={`border-line sticky top-0 z-40 flex items-center gap-2 border-b border-l px-3 py-3 transition-colors ${
              drag && drag.col === i && drag.col !== drag.originCol ? 'bg-paper-2' : 'bg-paper'
            }`}
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
        <div className="bg-paper sticky left-0 z-20" style={{ height }}>
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

        {columns.map((c, colIndex) => {
          const layout = lanes(c.appointments, timezone);
          return (
            <div
              key={c.key}
              ref={(el) => {
                colRefs.current[colIndex] = el;
              }}
              className="border-line relative border-l"
              style={{ height }}
            >
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

              {c.workingRanges &&
                offRanges(c.workingRanges).map((r) => (
                  <div
                    key={r.start}
                    aria-hidden
                    className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_srgb,var(--line)_55%,transparent)_6px_7px)]"
                    style={{ top: y(r.start), height: y(r.end) - y(r.start) }}
                  />
                ))}

              {canCreate &&
                !drag &&
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

              {c.isToday && nowMin >= startMin && nowMin <= endMin && (
                <div
                  aria-hidden
                  className="border-accent absolute inset-x-0 z-20 border-t-2"
                  style={{ top: y(nowMin) }}
                >
                  <span className="bg-accent absolute -top-[5px] -left-[5px] size-2 rounded-full" />
                </div>
              )}

              {c.appointments.map((a) => {
                const pos = layout.get(a.id) ?? { lane: 0, lanes: 1 };
                const start = localMinute(a.startsAt, timezone);
                if (pending?.id === a.id) return null;
                return block(
                  a,
                  start,
                  pos,
                  drag?.active && drag.id === a.id ? 'origin' : 'normal',
                  colIndex,
                );
              })}

              {/* Vista previa del destino (arrastre) o de la cita mientras el servidor confirma */}
              {drag?.active &&
                drag.col === colIndex &&
                block(drag.appt, drag.minute, { lane: 0, lanes: 1 }, 'ghost', colIndex)}
              {pending &&
                pending.col === colIndex &&
                (() => {
                  const a = columns.flatMap((x) => x.appointments).find((x) => x.id === pending.id);
                  return a
                    ? block(a, pending.minute, { lane: 0, lanes: 1 }, 'pending', colIndex)
                    : null;
                })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
