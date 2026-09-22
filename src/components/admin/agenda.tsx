'use client';

import { STATUS } from '@/components/ui/status-badge';
import { formatTime } from '@/lib/format';
import type { AdminAppointment } from '@/lib/admin/types';
import { StatusActions } from './status-actions';

/**
 * Agenda del día como línea de tiempo: hora a la izquierda, quién y qué, y el siguiente paso a un toque.
 * Las citas ya pasadas quedan atenuadas; la próxima se marca.
 */
export function Agenda({
  items,
  timezone,
  onOpen,
}: {
  items: AdminAppointment[];
  timezone: string;
  onOpen: (id: string) => void;
}) {
  const now = Date.now();
  const nextId = items.find(
    (a) => new Date(a.endsAt).getTime() > now && a.status !== 'NO_SHOW',
  )?.id;

  if (!items.length) {
    return (
      <div className="border-line rounded-2xl border border-dashed px-6 py-10 text-center">
        <p className="font-display text-2xl">Día libre de citas</p>
        <p className="text-stone mt-1">Cuando alguien reserve, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {items.map((a) => {
        const past = new Date(a.endsAt).getTime() <= now;
        const s = STATUS[a.status];
        return (
          <li
            key={a.id}
            className={`border-line grid grid-cols-[4.5rem_1fr] gap-4 border-b py-4 last:border-b-0 ${past && a.id !== nextId ? 'opacity-60' : ''}`}
          >
            <div className="pt-0.5">
              <p className="tabular font-display text-xl leading-none">
                {formatTime(a.startsAt, timezone).replace(/\s?[ap]\.\s?m\./, '')}
              </p>
              <p className="text-stone mt-1 text-xs">
                {formatTime(a.startsAt, timezone).match(/[ap]\.\s?m\./)?.[0]}
              </p>
              {a.id === nextId && (
                <p className="text-accent mt-2 text-[0.7rem] tracking-[0.12em] uppercase">
                  Próxima
                </p>
              )}
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(a.id)}
                className="group block w-full text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: a.professional.color }}
                  />
                  <span className="truncate text-[1.05rem] group-hover:underline">
                    {a.customer.name}
                  </span>
                </span>
                <span className="text-stone mt-0.5 block text-sm">
                  {a.serviceNameSnapshot} · con {a.professional.name}
                </span>
                <span className="text-stone mt-1.5 flex items-center gap-1.5 text-xs">
                  <span aria-hidden className={`size-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </button>
              <div className="mt-3">
                <StatusActions appointment={a} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
