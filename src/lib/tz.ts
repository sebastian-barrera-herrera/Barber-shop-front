/**
 * Fechas en la zona horaria del negocio (mismo algoritmo que el backend, con Intl).
 * "fecha local" = 'YYYY-MM-DD'; "minuto" = minutos desde medianoche local.
 */

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(timeZone: string) {
  let f = cache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    cache.set(timeZone, f);
  }
  return f;
}

function parts(date: Date, timeZone: string) {
  const p: Record<string, number> = {};
  for (const x of fmt(timeZone).formatToParts(date))
    if (x.type !== 'literal') p[x.type] = Number(x.value);
  return { ...p, hour: p.hour === 24 ? 0 : p.hour } as Record<
    'year' | 'month' | 'day' | 'hour' | 'minute' | 'second',
    number
  >;
}

function offset(instant: number, timeZone: string) {
  const p = parts(new Date(instant), timeZone);
  return (
    Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) -
    Math.floor(instant / 1000) * 1000
  );
}

export function zonedToUtc(date: string, minuteOfDay: number, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minuteOfDay);
  return new Date(naive - offset(naive - offset(naive, timeZone), timeZone));
}

export function localDate(date: Date | string, timeZone: string): string {
  const p = parts(new Date(date), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function localMinute(date: Date | string, timeZone: string): number {
  const p = parts(new Date(date), timeZone);
  return p.hour * 60 + p.minute;
}

export function localHour(timeZone: string): number {
  return parts(new Date(), timeZone).hour;
}

export function weekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Lunes de la semana de la fecha. */
export function startOfWeek(date: string): string {
  const w = weekday(date);
  return shiftDays(date, w === 0 ? -6 : 1 - w);
}

export function shiftDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function monthGrid(date: string): string[] {
  const first = `${date.slice(0, 7)}-01`;
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => shiftDays(start, i));
}

export function shiftMonths(date: string, months: number): string {
  const [y, m] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
}

export const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};
