'use client';

import { formatDuration, formatMoney } from '@/lib/format';
import type { CatalogGroup, PublicService } from '@/lib/types';

/** Paso 1: la carta en versión compacta. Un toque elige el servicio. */
export function StepService({
  groups,
  currency,
  selectedSlug,
  onSelect,
}: {
  groups: CatalogGroup[];
  currency: string;
  selectedSlug: string | null;
  onSelect: (service: PublicService) => void;
}) {
  if (!groups.length) {
    return (
      <p className="text-stone">No hay servicios disponibles para reservar en este momento.</p>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <fieldset key={group.slug}>
          <legend className="eyebrow mb-2">{group.name}</legend>
          <div role="radiogroup" aria-label={group.name} className="border-ink/80 border-t">
            {group.services.map((s) => {
              const selected = s.slug === selectedSlug;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onSelect(s)}
                  className={`group border-line hover:bg-paper-2 flex w-full items-center justify-between gap-4 border-b px-1 py-4 text-left transition-colors ${
                    selected ? 'bg-paper-2' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[1.05rem]">{s.name}</span>
                    <span className="text-stone block text-sm">
                      {formatDuration(s.durationMinutes)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="tabular">{formatMoney(s.priceCents, currency)}</span>
                    <span
                      aria-hidden
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        selected ? 'border-ink bg-ink' : 'border-stone/60 group-hover:border-ink'
                      }`}
                    >
                      {selected && <span className="bg-paper size-1.5 rounded-full" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
