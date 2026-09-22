/** Archivo .ics para "Agregar a mi calendario" (Google, Apple, Outlook lo abren). */

const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const escape = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/([,;])/g, '\\$1')
    .replace(/\n/g, '\\n');

export function buildIcs(e: {
  uid: string;
  title: string;
  start: string | Date;
  end: string | Date;
  location?: string;
  description?: string;
}): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studio Booking//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@studio-booking`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(e.start))}`,
    `DTEND:${stamp(new Date(e.end))}`,
    `SUMMARY:${escape(e.title)}`,
    ...(e.location ? [`LOCATION:${escape(e.location)}`] : []),
    ...(e.description ? [`DESCRIPTION:${escape(e.description)}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(e.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
