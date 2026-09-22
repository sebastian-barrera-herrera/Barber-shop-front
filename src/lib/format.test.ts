import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateParts,
  formatDuration,
  formatHhmm,
  formatMoney,
  initials,
  prettyPhone,
  whatsappLink,
} from './format';

describe('format', () => {
  it('pesos colombianos sin decimales y sin espacios', () => {
    expect(formatMoney(3_500_000, 'COP')).toBe('$35.000');
    expect(formatMoney(12_000_000, 'COP')).toBe('$120.000');
    expect(formatMoney(0, 'COP')).toBe('$0');
  });

  it('duraciones en palabras cortas', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });

  it('horas en formato de Colombia', () => {
    expect(formatHhmm('16:00').replace(/\s/g, ' ')).toMatch(/^4:00 p\.\s?m\.$/);
    expect(formatHhmm('09:30').replace(/\s/g, ' ')).toMatch(/^9:30 a\.\s?m\.$/);
  });

  it('fechas locales', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(dateParts('2026-09-28')).toMatchObject({ day: '28', weekdayIndex: 1 });
  });

  it('teléfonos y WhatsApp', () => {
    expect(prettyPhone('+573001234567')).toBe('300 123 4567');
    expect(prettyPhone('+12125550100')).toBe('+12125550100');
    expect(whatsappLink('+57 300 123 4567', 'Hola')).toBe('https://wa.me/573001234567?text=Hola');
  });

  it('iniciales', () => {
    expect(initials('María José López')).toBe('MJ');
    expect(initials('carlos')).toBe('C');
  });
});
