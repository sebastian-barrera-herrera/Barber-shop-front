'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { publicApi } from '@/lib/api';
import { addDays, dateParts, formatHhmm, formatLongDate, todayIn } from '@/lib/format';
import type { AvailabilityDay, Slot } from '@/lib/types';

const PAGE = 14;

/** Paso 3: fecha (tira de días) y hora (agrupadas por momento del día) en la misma pantalla. */
export function StepTime({
  serviceId,
  professionalId,
  timezone,
  maxAdvanceDays,
  date,
  onDate,
  onSlot,
}: {
  serviceId: string;
  professionalId?: string;
  timezone: string;
  maxAdvanceDays: number;
  date: string | null;
  onDate: (date: string, replace?: boolean) => void;
  onSlot: (slot: Slot) => void;
}) {
  const today = useMemo(() => todayIn(timezone), [timezone]);
  const lastDay = addDays(today, maxAdvanceDays);
  const [until, setUntil] = useState(() => addDays(today, PAGE - 1));
  const [days, setDays] = useState<AvailabilityDay[] | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Días con cupo
  useEffect(() => {
    let cancelled = false;
    setError(null);
    publicApi
      .days({ serviceId, professionalId, from: today, to: until < lastDay ? until : lastDay })
      .then((d) => {
        if (cancelled) return;
        setDays(d);
        // Si no hay fecha elegida (o la elegida no tiene cupo), saltar al primer día disponible.
        const chosen = d.find((x) => x.date === date);
        if (!chosen || !chosen.available) {
          const first = d.find((x) => x.available);
          if (first) onDate(first.date, true);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [serviceId, professionalId, today, until, lastDay]);

  // Horas del día elegido
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setSlots(null);
    publicApi
      .slots({ serviceId, professionalId, date })
      .then((r) => !cancelled && setSlots(r.slots))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [serviceId, professionalId, date]);

  useEffect(() => {
    stripRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [date, days]);

  const groups = useMemo(() => {
    const by: Record<string, Slot[]> = { Mañana: [], Tarde: [], Noche: [] };
    for (const s of slots ?? []) {
      const h = Number(s.time.slice(0, 2));
      by[h < 12 ? 'Mañana' : h < 18 ? 'Tarde' : 'Noche'].push(s);
    }
    return Object.entries(by).filter(([, list]) => list.length);
  }, [slots]);

  const noDaysAvailable = days !== null && !days.some((d) => d.available);

  return (
    <div>
      {error && (
        <p role="alert" className="border-line bg-paper-2 mb-6 rounded-xl border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex items-baseline justify-between">
        <h3 className="eyebrow">Fecha</h3>
        {date && (
          <p className="text-stone text-sm first-letter:uppercase">
            {formatLongDate(`${date}T12:00:00Z`, 'UTC')}
          </p>
        )}
      </div>

      <div
        ref={stripRef}
        className="-mx-4 mt-3 flex snap-x [scrollbar-width:thin] gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {days === null
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="bg-paper-2 h-20 w-16 shrink-0 animate-pulse rounded-2xl" />
            ))
          : days.map((d, i) => {
              const p = dateParts(d.date);
              const showMonth = i === 0 || p.day === '1';
              const selected = d.date === date;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={!d.available}
                  aria-pressed={selected}
                  aria-label={`${formatLongDate(`${d.date}T12:00:00Z`, 'UTC')}${d.available ? '' : ', sin horas disponibles'}`}
                  onClick={() => onDate(d.date)}
                  className={`flex h-20 w-16 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border transition-colors ${
                    selected
                      ? 'border-ink bg-ink text-paper'
                      : d.available
                        ? 'border-line hover:border-ink'
                        : 'text-stone/45 border-transparent'
                  }`}
                >
                  <span className="text-xs capitalize">{p.weekday}</span>
                  <span
                    className={`font-display tabular text-2xl leading-tight ${!d.available ? 'line-through decoration-1' : ''}`}
                  >
                    {p.day}
                  </span>
                  <span className={`text-[0.7rem] ${showMonth ? '' : 'invisible'}`}>{p.month}</span>
                </button>
              );
            })}
        {days !== null && until < lastDay && (
          <button
            type="button"
            onClick={() => setUntil(addDays(until, PAGE))}
            className="border-stone/60 text-stone hover:border-ink hover:text-ink flex h-20 shrink-0 items-center rounded-2xl border border-dashed px-4 text-sm"
          >
            Más fechas
          </button>
        )}
      </div>

      <div className="mt-8">
        <h3 className="eyebrow">Hora</h3>
        {noDaysAvailable ? (
          <p className="text-stone mt-3">
            No hay horas libres en estas fechas. Prueba con más fechas u otro profesional.
          </p>
        ) : slots === null ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="bg-paper-2 h-11 animate-pulse rounded-full" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-stone mt-3">Este día ya no tiene horas libres. Elige otra fecha.</p>
        ) : (
          <div className="mt-3 space-y-6">
            {groups.map(([period, list]) => (
              <div key={period}>
                <p className="text-stone mb-2 text-sm">{period}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {list.map((s) => (
                    <button
                      key={s.startsAt}
                      type="button"
                      onClick={() => onSlot(s)}
                      className="tabular border-line hover:border-ink hover:bg-ink hover:text-paper h-11 rounded-full border text-[0.95rem] transition-colors"
                    >
                      {formatHhmm(s.time)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
