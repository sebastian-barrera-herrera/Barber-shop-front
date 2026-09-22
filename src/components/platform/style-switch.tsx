'use client';

import type { BusinessStyle } from '@/lib/types';

const OPTIONS: { value: BusinessStyle; label: string }[] = [
  { value: 'BARBER', label: 'Barbería' },
  { value: 'SPA', label: 'Spa o belleza' },
];

/**
 * El interruptor de la portada: quien va a crear su negocio ve la plataforma
 * con el diseño que le tocará. No es una preferencia guardada, es una prueba.
 */
export function StyleSwitch({
  value,
  onChange,
}: {
  value: BusinessStyle;
  onChange: (v: BusinessStyle) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ver la plataforma como"
      className="border-line bg-paper-2/60 inline-flex gap-1 rounded-[calc(var(--radius-btn)+4px)] border p-1"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="aria-checked:bg-brand aria-checked:text-on-brand text-stone hover:text-ink rounded-[var(--radius-btn)] px-5 py-2 text-sm transition-colors"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
