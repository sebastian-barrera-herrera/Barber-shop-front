import { describe, expect, it } from 'vitest';
import { buildIcs } from './ics';

describe('archivo de calendario', () => {
  it('genera un evento válido con recordatorio 2 horas antes', () => {
    const ics = buildIcs({
      uid: 'abc',
      title: 'Corte, barba; y más',
      start: '2026-09-25T21:00:00.000Z',
      end: '2026-09-25T21:45:00.000Z',
      location: 'Calle 85 # 11-20, Bogotá',
      description: 'Con Carlos\nVer: https://x',
    });
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('DTSTART:20260925T210000Z');
    expect(lines).toContain('DTEND:20260925T214500Z');
    expect(lines).toContain('SUMMARY:Corte\\, barba\\; y más');
    expect(lines).toContain('TRIGGER:-PT2H');
    expect(ics).toContain('DESCRIPTION:Con Carlos\\nVer: https://x');
    expect(lines.at(-1)).toBe('END:VCALENDAR');
  });
});
