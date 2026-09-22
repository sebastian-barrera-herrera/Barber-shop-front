import { formatHhmm } from './format';
import type { OpeningDay } from './types';

function nowIn(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { weekday, minute: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** "Abierto ahora · cierra a las 7:00 p. m." / "Cerrado · abre mañana a las 9:00 a. m." */
export function openStatus(days: OpeningDay[], timeZone: string): { open: boolean; label: string } {
  if (!days.length) return { open: false, label: '' };
  const { weekday, minute } = nowIn(timeZone);
  const today = days.find((d) => d.weekday === weekday);

  if (today && !today.closed && minute >= toMin(today.open) && minute < toMin(today.close)) {
    return { open: true, label: `Abierto ahora · hasta las ${formatHhmm(today.close)}` };
  }
  if (today && !today.closed && minute < toMin(today.open)) {
    return { open: false, label: `Abre hoy a las ${formatHhmm(today.open)}` };
  }
  for (let i = 1; i <= 7; i++) {
    const day = days.find((d) => d.weekday === (weekday + i) % 7);
    if (day && !day.closed) {
      const when =
        i === 1
          ? 'mañana'
          : [
              'el domingo',
              'el lunes',
              'el martes',
              'el miércoles',
              'el jueves',
              'el viernes',
              'el sábado',
            ][day.weekday];
      return { open: false, label: `Cerrado · abre ${when} a las ${formatHhmm(day.open)}` };
    }
  }
  return { open: false, label: 'Cerrado' };
}

/** Lunes primero, como se lee un horario en Colombia. */
export function weekOrder(days: OpeningDay[]): OpeningDay[] {
  return [1, 2, 3, 4, 5, 6, 0]
    .map((w) => days.find((d) => d.weekday === w))
    .filter((d): d is OpeningDay => !!d);
}

export function currentWeekday(timeZone: string): number {
  return nowIn(timeZone).weekday;
}
