import type { BusinessStyle } from '@/lib/types';

const CONTENT: Record<
  BusinessStyle,
  { name: string; title: string; last: string; lead: string; rows: [string, string, string][] }
> = {
  BARBER: {
    name: 'Barbería El Bigote',
    title: 'El buen corte',
    last: 'no pasa de moda',
    lead: 'Reserva tu silla en un minuto. Sin llamadas, sin esperas.',
    rows: [
      ['Corte clásico', '45 min', '$35.000'],
      ['Corte + barba', '60 min', '$50.000'],
      ['Afeitado a navaja', '30 min', '$30.000'],
    ],
  },
  SPA: {
    name: 'Spa Luna',
    title: 'Un rato',
    last: 'para ti',
    lead: 'Reserva tu cita en un minuto y llega a desconectarte.',
    rows: [
      ['Masaje relajante', '60 min', '$110.000'],
      ['Limpieza facial', '60 min', '$80.000'],
      ['Manicure spa', '45 min', '$40.000'],
    ],
  },
};

/** Maqueta de la página que recibe cada negocio: cambia con el interruptor de la portada. */
export function SitePreview({ style }: { style: BusinessStyle }) {
  const c = CONTENT[style];
  return (
    <div className="border-line bg-paper overflow-hidden rounded-[calc(var(--radius-card)+6px)] border shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
      <div className="border-line bg-paper-2 flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-line size-2.5 rounded-full" />
        <span className="bg-line size-2.5 rounded-full" />
        <span className="bg-line size-2.5 rounded-full" />
        <span className="text-stone ml-3 truncate text-xs">
          filo.co/{style === 'BARBER' ? 'el-bigote' : 'spa-luna'}
        </span>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <div className="border-line flex items-center justify-between border-b pb-4">
          <span className="font-display text-lg">{c.name}</span>
          <span className="bg-brand text-on-brand rounded-[var(--radius-btn)] px-3 py-1.5 text-xs">
            Reservar
          </span>
        </div>

        <p className="font-display mt-7 text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.02]">
          {c.title} <span className="italic">{c.last}</span>
        </p>
        <p className="text-stone mt-3 max-w-sm text-sm">{c.lead}</p>

        <ul className="mt-7 space-y-3">
          {c.rows.map(([name, time, price]) => (
            <li key={name} className="flex items-baseline gap-3 text-sm">
              <span>{name}</span>
              <span className="leader" aria-hidden />
              <span className="text-stone text-xs">{time}</span>
              <span className="tabular">{price}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
