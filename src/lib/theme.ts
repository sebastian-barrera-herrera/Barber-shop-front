import type { BarberPreset, BrandPreset, BusinessProfile, BusinessStyle, SpaPreset } from './types';

/**
 * Identidad visual por negocio. Cada preset define papel, tinta, piedra, línea y acento.
 * El negocio puede ajustar el color principal (botones) y el secundario (acento) desde el panel.
 */
export interface ThemeTokens {
  paper: string;
  paper2: string;
  ink: string;
  stone: string;
  line: string;
  accent: string;
  brand: string;
  scheme: 'light' | 'dark';
  /** Material del objeto 3D del hero */
  material: 'ceramic' | 'metal' | 'stone' | 'lacquer' | 'silk';
  /**
   * Cómo se componen los títulos:
   * 'editorial' = serif con cursivas (spa) · 'signage' = condensada en mayúsculas, como un letrero (barbería).
   */
  face: 'editorial' | 'signage';
}

export const PRESETS: Record<BrandPreset, ThemeTokens> = {
  studio: {
    paper: '#F4F0E8',
    paper2: '#ECE6DA',
    ink: '#141412',
    stone: '#6D675D',
    line: '#D9D2C5',
    accent: '#A07C42',
    brand: '#141412',
    scheme: 'light',
    material: 'ceramic',
    face: 'editorial',
  },
  barber: {
    paper: '#141311',
    paper2: '#1C1A17',
    ink: '#EDE6D8',
    stone: '#A39A8A',
    line: '#34302A',
    accent: '#C29A5B',
    brand: '#EDE6D8',
    scheme: 'dark',
    material: 'metal',
    face: 'editorial',
  },
  spa: {
    paper: '#EEEBE3',
    paper2: '#E4E1D6',
    ink: '#1F2A24',
    stone: '#5B675D',
    line: '#D2D6CB',
    accent: '#5E7A5D',
    brand: '#1F2A24',
    scheme: 'light',
    material: 'stone',
    face: 'editorial',
  },
  nails: {
    paper: '#F7F3EF',
    paper2: '#EFE8E2',
    ink: '#1A1416',
    stone: '#746469',
    line: '#E5DAD6',
    accent: '#9E2B3A',
    brand: '#1A1416',
    scheme: 'light',
    material: 'lacquer',
    face: 'editorial',
  },
  beauty: {
    paper: '#F5EFE9',
    paper2: '#ECE3DA',
    ink: '#1E1714',
    stone: '#716258',
    line: '#E4D8CE',
    accent: '#A8553A',
    brand: '#1E1714',
    scheme: 'light',
    material: 'silk',
    face: 'editorial',
  }, // ── Estilo Barbería: carbón con textura de espiga, letrero clásico ──
  clasico: {
    paper: '#1B1A19',
    paper2: '#252321',
    ink: '#F0ECE4',
    stone: '#ABA398',
    line: '#3B3733',
    accent: '#E0625C',
    brand: '#C0413E',
    scheme: 'dark',
    material: 'metal',
    face: 'signage',
  },
  ingles: {
    paper: '#161D19',
    paper2: '#1E2721',
    ink: '#EDEAE1',
    stone: '#A5ACA1',
    line: '#33403A',
    accent: '#CFAE6A',
    brand: '#CFAE6A',
    scheme: 'dark',
    material: 'metal',
    face: 'signage',
  },
  ebano: {
    paper: '#111111',
    paper2: '#1B1B1B',
    ink: '#F2EEE6',
    stone: '#A8A298',
    line: '#2F2F2F',
    accent: '#D4B36E',
    brand: '#D4B36E',
    scheme: 'dark',
    material: 'metal',
    face: 'signage',
  },
};

export const SPA_PRESETS: SpaPreset[] = ['studio', 'barber', 'spa', 'nails', 'beauty'];
export const BARBER_PRESETS: BarberPreset[] = ['clasico', 'ingles', 'ebano'];

/** Paletas que puede elegir cada estilo. */
export function presetsFor(style: BusinessStyle): BrandPreset[] {
  return style === 'BARBER' ? BARBER_PRESETS : SPA_PRESETS;
}

/** Valores por defecto del backend: si no cambiaron, manda el preset. */
const DEFAULT_PRIMARY = '#141412';
const DEFAULT_SECONDARY = '#A8854A';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function resolveTheme(
  branding?: BusinessProfile['branding'],
  style: BusinessStyle = 'SPA',
): ThemeTokens {
  // Una paleta de un estilo nunca se aplica al otro (p. ej. datos viejos): cae a la primera del estilo.
  const allowed = presetsFor(style);
  const key = branding?.preset && allowed.includes(branding.preset) ? branding.preset : allowed[0];
  const preset = PRESETS[key];
  const valid = (c?: string) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c : undefined);
  const primary = valid(branding?.primaryColor);
  const secondary = valid(branding?.secondaryColor);

  // Un color personalizado solo se usa si se lee bien sobre el papel (contraste AA para texto grande).
  const brand =
    primary &&
    primary.toUpperCase() !== DEFAULT_PRIMARY &&
    contrastRatio(primary, preset.paper) >= 3
      ? primary
      : preset.brand;
  const accent =
    secondary &&
    secondary.toUpperCase() !== DEFAULT_SECONDARY &&
    contrastRatio(secondary, preset.paper) >= 3
      ? secondary
      : preset.accent;
  return { ...preset, brand, accent };
}

/** Cada cara tipográfica trae su caja, su peso y hasta sus esquinas. */
const FACES = {
  editorial: {
    family: "var(--font-fraunces), 'Iowan Old Style', Georgia, serif",
    case: 'none',
    weight: '300',
    tracking: '-0.02em',
    radiusBtn: '9999px',
    radiusCard: '24px',
  },
  signage: {
    family: "var(--font-saira), 'Arial Narrow', ui-sans-serif, sans-serif",
    case: 'uppercase',
    weight: '700',
    tracking: '0.01em',
    radiusBtn: '6px',
    radiusCard: '8px',
  },
} as const;

/** Variables CSS que se inyectan en <html>. */
export function themeStyle(t: ThemeTokens): Record<string, string> {
  const onBrand =
    contrastRatio('#FFFFFF', t.brand) >= contrastRatio('#111111', t.brand) ? '#FFFFFF' : '#111111';
  return {
    '--paper': t.paper,
    '--paper-2': t.paper2,
    '--ink': t.ink,
    '--stone': t.stone,
    '--line': t.line,
    '--accent': t.accent,
    '--brand': t.brand,
    '--on-brand': onBrand,
    '--display-face': FACES[t.face].family,
    '--display-case': FACES[t.face].case,
    '--display-weight': FACES[t.face].weight,
    '--display-tracking': FACES[t.face].tracking,
    '--radius-btn': FACES[t.face].radiusBtn,
    '--radius-card': FACES[t.face].radiusCard,
    colorScheme: t.scheme,
  };
}

/** CSS para aplicar el tema a todo el documento (incluye portales como drawers y avisos). */
export function themeCss(t: ThemeTokens): string {
  const vars = Object.entries(themeStyle(t))
    .map(([k, v]) => (k === 'colorScheme' ? `color-scheme:${v}` : `${k}:${v}`))
    .join(';');
  // La textura de espiga (tweed) solo existe en el estilo de letrero.
  const texture =
    t.face === 'signage'
      ? `body{background-image:repeating-linear-gradient(45deg,color-mix(in srgb,var(--ink) 4%, transparent) 0 2px,transparent 2px 7px),repeating-linear-gradient(-45deg,color-mix(in srgb,var(--ink) 4%, transparent) 0 2px,transparent 2px 7px);background-size:14px 14px;background-attachment:fixed}`
      : 'body{background-image:none}';
  return `:root{${vars}}${texture}`;
}
