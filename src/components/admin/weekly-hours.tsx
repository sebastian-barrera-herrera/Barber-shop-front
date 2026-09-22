'use client';

import { toMinutes } from '@/lib/tz';

export interface DayHours {
  weekday: number;
  ranges: { start: string; end: string }[];
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Revisa el horario antes de guardar. Devuelve el primer problema en palabras simples. */
export function validateWeek(days: DayHours[]): string | null {
  for (const d of days) {
    const sorted = [...d.ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 0; i < sorted.length; i++) {
      if (!sorted[i].start || !sorted[i].end) return `${DAYS[d.weekday]}: completa las horas`;
      if (toMinutes(sorted[i].end) <= toMinutes(sorted[i].start)) {
        return `${DAYS[d.weekday]}: la salida debe ser después de la entrada`;
      }
      if (i > 0 && toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
        return `${DAYS[d.weekday]}: las franjas se cruzan`;
      }
    }
  }
  return null;
}

/**
 * Horario semanal: cada día se activa o se marca como descanso, con una o más franjas
 * (una pausa para almuerzo = dos franjas).
 */
export function WeeklyHours({
  value,
  onChange,
}: {
  value: DayHours[];
  onChange: (v: DayHours[]) => void;
}) {
  const get = (w: number) => value.find((d) => d.weekday === w) ?? { weekday: w, ranges: [] };
  const set = (w: number, ranges: DayHours['ranges']) =>
    onChange(
      [...value.filter((d) => d.weekday !== w), { weekday: w, ranges }].sort(
        (a, b) => a.weekday - b.weekday,
      ),
    );

  return (
    <ul className="divide-line border-line divide-y rounded-2xl border">
      {ORDER.map((w) => {
        const day = get(w);
        const open = day.ranges.length > 0;
        return (
          <li key={w} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3">
            <label className="flex w-32 items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                checked={open}
                onChange={(e) => set(w, e.target.checked ? [{ start: '09:00', end: '18:00' }] : [])}
                className="size-4 accent-[var(--ink)]"
              />
              <span className={open ? '' : 'text-stone'}>{DAYS[w]}</span>
            </label>
            {open ? (
              <div className="flex flex-1 flex-col gap-2">
                {day.ranges.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={r.start}
                      aria-label={`${DAYS[w]}: entrada ${i + 1}`}
                      onChange={(e) =>
                        set(
                          w,
                          day.ranges.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)),
                        )
                      }
                      className="tabular border-line bg-paper h-10 rounded-lg border px-2"
                    />
                    <span className="text-stone">a</span>
                    <input
                      type="time"
                      value={r.end}
                      aria-label={`${DAYS[w]}: salida ${i + 1}`}
                      onChange={(e) =>
                        set(
                          w,
                          day.ranges.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)),
                        )
                      }
                      className="tabular border-line bg-paper h-10 rounded-lg border px-2"
                    />
                    {day.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            w,
                            day.ranges.filter((_, j) => j !== i),
                          )
                        }
                        className="text-stone text-sm underline underline-offset-2"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ))}
                {day.ranges.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      const last = day.ranges[day.ranges.length - 1];
                      set(w, [...day.ranges, { start: last?.end ?? '14:00', end: '18:00' }]);
                    }}
                    className="text-stone hover:text-ink self-start text-sm underline underline-offset-2"
                  >
                    + Agregar pausa / otra franja
                  </button>
                )}
              </div>
            ) : (
              <span className="text-stone pt-2 text-sm">Descansa</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
