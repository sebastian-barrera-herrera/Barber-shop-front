'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useMarkNotificationsRead, useNotifications } from '@/lib/admin/hooks';

function ago(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

/** Campana con los avisos del negocio (nuevas reservas, mensajes, pagos). */
export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notifications.data?.unread ?? 0;

  const hrefFor = (type: string, data: Record<string, string> | null) =>
    type.startsWith('message')
      ? '/admin/mensajes'
      : data?.appointmentId
        ? `/admin/citas?id=${data.appointmentId}`
        : '/admin';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (unread) markRead.mutate();
        }}
        aria-label={unread ? `Avisos: ${unread} sin leer` : 'Avisos'}
        className="hover:bg-paper-2 relative flex size-10 items-center justify-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path
            d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 && (
          <span className="tabular bg-accent absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Avisos">
        {!notifications.data?.items.length ? (
          <p className="text-stone">Aquí verás las nuevas reservas, mensajes y pagos.</p>
        ) : (
          <ul className="divide-line divide-y">
            {notifications.data.items.map((n) => (
              <li key={n.id}>
                <Link
                  href={hrefFor(n.type, n.data)}
                  onClick={() => setOpen(false)}
                  className="hover:bg-paper-2 block py-3"
                >
                  <p className="flex items-center gap-2">
                    {!n.readAt && (
                      <span
                        aria-label="Nuevo"
                        className="bg-accent size-1.5 shrink-0 rounded-full"
                      />
                    )}
                    {n.title}
                  </p>
                  {n.body && <p className="text-stone text-sm">{n.body}</p>}
                  <p className="text-stone mt-0.5 text-xs">{ago(n.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}
