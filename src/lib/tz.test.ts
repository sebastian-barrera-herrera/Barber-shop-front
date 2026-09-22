import { describe, expect, it } from 'vitest';
import {
  localDate,
  localMinute,
  monthGrid,
  shiftMonths,
  startOfWeek,
  weekday,
  zonedToUtc,
} from './tz';

describe('zona horaria del negocio', () => {
  it('hora local de Bogotá → UTC y de vuelta', () => {
    const d = zonedToUtc('2026-09-25', 16 * 60, 'America/Bogota');
    expect(d.toISOString()).toBe('2026-09-25T21:00:00.000Z');
    expect(localDate(d, 'America/Bogota')).toBe('2026-09-25');
    expect(localMinute(d, 'America/Bogota')).toBe(16 * 60);
  });

  it('respeta el cambio de horario (DST)', () => {
    expect(zonedToUtc('2026-03-07', 600, 'America/New_York').toISOString()).toBe(
      '2026-03-07T15:00:00.000Z',
    );
    expect(zonedToUtc('2026-03-09', 600, 'America/New_York').toISOString()).toBe(
      '2026-03-09T14:00:00.000Z',
    );
  });

  it('calendario: semana desde el lunes, mes de 6 semanas', () => {
    expect(weekday('2026-09-27')).toBe(0);
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21');
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21');
    const grid = monthGrid('2026-09-15');
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-08-31');
    expect(shiftMonths('2026-01-31', 1)).toBe('2026-02-01');
  });
});
