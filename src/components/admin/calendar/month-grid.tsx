'use client';

import { STATUS } from '@/components/ui/status-badge';
import { formatTime } from '@/lib/format';
import type { AdminAppointment } from '@/lib/admin/types';
import { localDate, monthGrid } from '@/lib/tz';

const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Vista mensual: cuántas citas hay cada día y las primeras. Tocar un día abre la vista Día. */
export function MonthGrid({
  date,
  today,
  appointments,
  timezone,
  onDay,
}: {
  date: string;
  today: string;
  appointments: AdminAppointment[];
  timezone: string;
  onDay: (date: string) => void;
}) {
  const days = monthGrid(date);
  const month = date.slice(0, 7);
  const byDay = new Map<string, AdminAppointment[]>();
  for (const a of appointments) {
    if (a.status === 'CANCELLED') continue;
    const d = localDate(a.startsAt, timezone);
    byDay.set(d, [...(byDay.get(d) ?? []), a]);
  }

  return (
    <div className="border-line overflow-hidden rounded-2xl border">
      <div className="border-line bg-paper grid grid-cols-7 border-b">
        {WEEK.map((d) => (
          <div key={d} className="text-stone px-2 py-2 text-center text-xs sm:text-left">
            {d}
          </div>
        ))}
      </div>
      <div className="bg-line grid grid-cols-7 gap-px">
        {days.map((d) => {
          const items = (byDay.get(d) ?? []).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
          const inMonth = d.startsWith(month);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onDay(d)}
              aria-label={`${d}: ${items.length} citas`}
              className={`bg-paper hover:bg-paper-2 flex min-h-[72px] flex-col items-start gap-1 p-1.5 text-left transition-colors sm:min-h-[112px] sm:p-2 ${inMonth ? '' : 'text-stone/50'}`}
            >
              <span
                className={`tabular flex size-7 items-center justify-center rounded-full text-sm ${d === today ? 'bg-ink text-paper' : ''}`}
              >
                {Number(d.slice(8))}
              </span>
              {items.length > 0 && (
                <>
                  <span className="text-stone text-[11px] sm:hidden">{items.length}</span>
                  <ul className="hidden w-full space-y-0.5 sm:block">
                    {items.slice(0, 3).map((a) => (
                      <li key={a.id} className="flex items-center gap-1.5 truncate text-[11px]">
                        <span
                          aria-hidden
                          className={`size-1.5 shrink-0 rounded-full ${STATUS[a.status].dot}`}
                        />
                        <span className="tabular text-stone">
                          {formatTime(a.startsAt, timezone).replace(/\s?[ap]\.\s?m\./, '')}
                        </span>
                        <span className="truncate">{a.customer.name.split(' ')[0]}</span>
                      </li>
                    ))}
                    {items.length > 3 && (
                      <li className="text-stone text-[11px]">+{items.length - 3} más</li>
                    )}
                  </ul>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
