const DEFAULT_LOCALE = 'es-CO';

/** 3500000 centavos → "$35.000" */
export function formatMoney(cents: number, currency = 'COP', locale = DEFAULT_LOCALE): string {
  const zeroDecimals = ['COP', 'CLP', 'JPY', 'PYG'].includes(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: zeroDecimals ? 0 : 2,
    maximumFractionDigits: zeroDecimals ? 0 : 2,
  })
    .format(cents / 100)
    .replace(/\s/g, '');
}

/** 45 → "45 min" · 60 → "1 h" · 90 → "1 h 30 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "jueves 25 de septiembre" en la zona del negocio */
export function formatLongDate(
  iso: string | Date,
  timeZone: string,
  locale = DEFAULT_LOCALE,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

/** "4:00 p. m." en la zona del negocio */
export function formatTime(iso: string | Date, timeZone: string, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso),
  );
}

/** "16:00" (HH:mm) → "4:00 p. m." */
export function formatHhmm(hhmm: string, locale = DEFAULT_LOCALE): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Fecha local 'YYYY-MM-DD' de hoy en la zona dada. */
export function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Para la tira de fechas: { weekday: "lun", day: "29", month: "sep" } */
export function dateParts(date: string, locale = DEFAULT_LOCALE) {
  const [y, m, d] = date.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' }).format(utc).replace('.', '');
  return {
    weekday: f({ weekday: 'short' }),
    day: String(d),
    month: f({ month: 'short' }),
    weekdayIndex: utc.getUTCDay(),
  };
}

/** "+573001234567" → "300 123 4567" para mostrar */
export function prettyPhone(e164: string): string {
  const co = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return co ? `${co[1]} ${co[2]} ${co[3]}` : e164;
}

export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
