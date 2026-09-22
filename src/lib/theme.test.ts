import { describe, expect, it } from 'vitest';
import { contrastRatio, PRESETS, resolveTheme, themeStyle } from './theme';

describe('temas por negocio', () => {
  it('todos los presets tienen texto legible (AA) sobre su papel', () => {
    for (const [name, p] of Object.entries(PRESETS)) {
      expect(contrastRatio(p.ink, p.paper), `${name}: tinta`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(p.stone, p.paper), `${name}: texto secundario`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrastRatio(p.stone, p.paper2),
        `${name}: texto secundario en tarjetas`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.accent, p.paper), `${name}: acento`).toBeGreaterThanOrEqual(3);
    }
  });

  it('sin configuración usa el estilo neutro', () => {
    expect(resolveTheme(undefined)).toMatchObject({
      paper: PRESETS.studio.paper,
      material: 'ceramic',
    });
  });

  it('respeta un color propio legible y descarta uno ilegible', () => {
    const base = {
      preset: 'studio',
      animations: true,
      fontPreset: 'editorial',
      heroTitle: '',
      heroSubtitle: '',
    } as const;
    expect(
      resolveTheme({ ...base, primaryColor: '#1F3A5F', secondaryColor: '#A8854A' }).brand,
    ).toBe('#1F3A5F');
    // Amarillo claro sobre papel claro: ilegible → se usa el del preset
    expect(
      resolveTheme({ ...base, primaryColor: '#F5F0A0', secondaryColor: '#FFFFEE' }),
    ).toMatchObject({
      brand: PRESETS.studio.brand,
      accent: PRESETS.studio.accent,
    });
  });

  it('el texto sobre botones tiene buen contraste en cada preset', () => {
    for (const p of Object.values(PRESETS)) {
      const style = themeStyle(p);
      expect(contrastRatio(style['--on-brand'], p.brand)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('cada estilo solo usa sus paletas', () => {
    const base = {
      animations: true,
      fontPreset: 'editorial',
      heroTitle: '',
      heroSubtitle: '',
      primaryColor: '#141412',
      secondaryColor: '#A8854A',
    } as const;
    expect(resolveTheme({ ...base, preset: 'ingles' }, 'BARBER').paper).toBe(PRESETS.ingles.paper);
    // Paleta de spa en una barbería → la clásica de barbería, y al revés.
    expect(resolveTheme({ ...base, preset: 'spa' }, 'BARBER').paper).toBe(PRESETS.clasico.paper);
    expect(resolveTheme({ ...base, preset: 'ebano' }, 'SPA').paper).toBe(PRESETS.studio.paper);
    expect(resolveTheme(undefined, 'BARBER').scheme).toBe('dark');
  });
});
