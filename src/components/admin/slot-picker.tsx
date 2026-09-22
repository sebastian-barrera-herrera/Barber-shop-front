'use client';

import { useState } from 'react';
import { formatHhmm } from '@/lib/format';
import { useSlots } from '@/lib/admin/queries';
import { zonedToUtc } from '@/lib/tz';
import { Field, TextInput } from './form';

/**
 * Horas libres para (servicio, profesional, fecha). Incluye "hora exacta" para casos
 * como las 10:05 y la opción explícita de agendar fuera del horario.
 */
export function SlotPicker({
  serviceId,
  professionalId,
  date,
  timezone,
  value,
  onChange,
  outsideHours,
  onOutsideHours,
  idPrefix,
}: {
  serviceId?: string;
  professionalId?: string;
  date: string;
  timezone: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  outsideHours: boolean;
  onOutsideHours: (v: boolean) => void;
  idPrefix: string;
}) {
  const slots = useSlots(serviceId, professionalId, date);
  const [exact, setExact] = useState(false);

  if (!serviceId || !professionalId) {
    return (
      <p className="text-stone text-sm">Elige servicio y profesional para ver las horas libres.</p>
    );
  }

  return (
    <div className="space-y-3">
      {!exact && (
        <>
          {slots.isLoading ? (
            <p className="text-stone text-sm">Buscando horas libres…</p>
          ) : slots.data?.length ? (
            <div
              role="radiogroup"
              aria-label="Hora"
              className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1"
            >
              {slots.data.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  role="radio"
                  aria-checked={value === s.startsAt}
                  onClick={() => onChange(s.startsAt)}
                  className={`tabular h-10 rounded-full border text-sm transition-colors ${
                    value === s.startsAt
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line hover:border-ink'
                  }`}
                >
                  {formatHhmm(s.time)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-stone text-sm">No quedan horas libres ese día.</p>
          )}
        </>
      )}

      {exact && (
        <Field label="Hora exacta" htmlFor={`${idPrefix}-exact`}>
          <TextInput
            id={`${idPrefix}-exact`}
            type="time"
            step={300}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              onChange(
                Number.isFinite(h) ? zonedToUtc(date, h * 60 + m, timezone).toISOString() : null,
              );
            }}
          />
        </Field>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setExact((v) => !v);
            onChange(null);
          }}
          className="text-stone hover:text-ink underline underline-offset-2"
        >
          {exact ? 'Ver horas libres' : 'Escribir una hora exacta'}
        </button>
        {exact && (
          <label className="text-stone flex items-center gap-2">
            <input
              type="checkbox"
              checked={outsideHours}
              onChange={(e) => onOutsideHours(e.target.checked)}
              className="size-4 accent-[var(--ink)]"
            />
            Permitir fuera del horario
          </label>
        )}
      </div>
    </div>
  );
}
