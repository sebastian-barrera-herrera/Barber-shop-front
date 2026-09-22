import Link from 'next/link';
import { Reveal } from '@/components/ui/reveal';
import { formatDuration, formatMoney } from '@/lib/format';
import type { CatalogGroup } from '@/lib/types';

/**
 * La carta: precios como en la pared del local — nombre, puntos y precio.
 * Cada fila lleva directo a reservar ese servicio.
 */
export function ServiceMenu({ groups, currency }: { groups: CatalogGroup[]; currency: string }) {
  if (!groups.length) {
    return <p className="text-stone">Pronto publicaremos nuestros servicios.</p>;
  }

  return (
    <div className="grid gap-x-16 gap-y-14 md:grid-cols-2">
      {groups.map((group, gi) => (
        <Reveal key={group.slug} delay={Math.min(gi, 3) * 0.05}>
          <section aria-labelledby={`cat-${group.slug}`}>
            <div className="border-ink/80 mb-2 flex items-baseline justify-between border-b pb-3">
              <h3
                id={`cat-${group.slug}`}
                className="font-display text-[1.75rem] leading-none font-normal"
              >
                {group.name}
              </h3>
              <span className="tabular text-stone text-sm">
                {String(group.services.length).padStart(2, '0')}
              </span>
            </div>
            <ul>
              {group.services.map((s) => (
                <li key={s.id} className="border-line border-b last:border-b-0">
                  <Link
                    href={`/reservar?servicio=${s.slug}`}
                    className="group block py-4 outline-offset-0"
                    aria-label={`Reservar ${s.name}, ${formatMoney(s.priceCents, currency)}, ${formatDuration(s.durationMinutes)}`}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="ease-soft text-[1.08rem] transition-transform duration-300 group-hover:translate-x-1">
                        {s.name}
                      </span>
                      <span className="leader" aria-hidden />
                      <span className="tabular text-[1.08rem]">
                        {formatMoney(s.priceCents, currency)}
                      </span>
                    </span>
                    <span className="text-stone mt-1 flex items-start justify-between gap-6 text-sm">
                      <span className="line-clamp-2 max-w-[34ch]">{s.description}</span>
                      <span className="flex shrink-0 items-center">
                        {formatDuration(s.durationMinutes)}
                        <span
                          aria-hidden
                          className="text-ink ease-soft inline-block w-0 overflow-hidden whitespace-nowrap transition-[width] duration-300 group-hover:w-[4.5rem]"
                        >
                          <span className="pl-3">Reservar</span>
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ))}
    </div>
  );
}
