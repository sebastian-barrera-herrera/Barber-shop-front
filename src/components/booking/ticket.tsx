import type { ReactNode } from 'react';

export interface TicketRow {
  label: string;
  value: ReactNode;
  /** Enlace "Cambiar" para volver a ese paso */
  onChange?: () => void;
}

/**
 * El comprobante de la cita. Durante la reserva se va llenando; al final "se imprime".
 * Mismo componente en el flujo, en la confirmación y en "mi cita".
 */
export function Ticket({
  businessName,
  title,
  rows,
  total,
  code,
  printed = false,
  footer,
}: {
  businessName: string;
  title: ReactNode;
  rows: TicketRow[];
  total?: { label: string; value: string };
  code?: string;
  printed?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`border-ink/85 bg-paper overflow-hidden rounded-[18px] border ${printed ? 'animate-print' : ''}`}
      aria-live="polite"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="eyebrow flex justify-between">
          <span>{businessName}</span>
          {code && <span className="tabular text-ink">N.º {code}</span>}
        </div>
        <p className="font-display mt-3 text-[1.7rem] leading-tight">{title}</p>
      </div>

      <dl className="border-ink/40 border-t border-dashed px-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-line flex items-baseline justify-between gap-4 border-b py-3 last:border-b-0"
          >
            <dt className="text-stone text-sm">{row.label}</dt>
            <dd className="flex items-baseline gap-3 text-right">
              <span>{row.value}</span>
              {row.onChange && (
                <button
                  type="button"
                  onClick={row.onChange}
                  className="text-stone hover:text-ink text-xs underline underline-offset-2"
                  aria-label={`Cambiar ${row.label.toLowerCase()}`}
                >
                  Cambiar
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {total && (
        <>
          <div className="perforation bg-ink/[0.06]" aria-hidden />
          <div className="flex items-baseline justify-between px-5 py-4">
            <span className="text-stone text-sm">{total.label}</span>
            <span className="tabular font-display text-2xl">{total.value}</span>
          </div>
        </>
      )}
      {footer && <div className="border-line text-stone border-t px-5 py-4 text-sm">{footer}</div>}
    </div>
  );
}
