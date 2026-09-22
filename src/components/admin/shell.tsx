'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { useAuth } from '@/lib/admin/auth';
import { useUnreadMessages } from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';
import type { Role } from '@/lib/admin/types';
import { GlobalSearch } from './global-search';
import { NotificationsButton } from './notifications-button';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
  badge?: 'messages';
}

const ALL: Role[] = ['OWNER', 'ADMIN', 'PROFESSIONAL'];
const STAFF: Role[] = ['OWNER', 'ADMIN'];

const NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Hoy',
    roles: ALL,
    icon: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1v-7.5Z',
  },
  {
    href: '/admin/calendario',
    label: 'Calendario',
    roles: ALL,
    icon: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm-1 4h16M9 4v4m6-4v4',
  },
  {
    href: '/admin/citas',
    label: 'Citas',
    roles: ALL,
    icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  },
  {
    href: '/admin/clientes',
    label: 'Clientes',
    roles: ALL,
    icon: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5m1-9.5a3 3 0 1 0 0-6m2 15c-.3-2.4-1.5-4.2-3.3-5',
  },
  {
    href: '/admin/mensajes',
    label: 'Mensajes',
    roles: STAFF,
    badge: 'messages',
    icon: 'M4 6h16v10H9l-5 4V6Z',
  },
  {
    href: '/admin/servicios',
    label: 'Servicios',
    roles: STAFF,
    icon: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h3',
  },
  {
    href: '/admin/profesionales',
    label: 'Profesionales',
    roles: STAFF,
    icon: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10c.8-4 3.6-6.5 7-6.5s6.2 2.5 7 6.5',
  },
  {
    href: '/admin/mi-horario',
    label: 'Mi horario',
    roles: ['PROFESSIONAL'],
    icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  },
  { href: '/admin/pagos', label: 'Pagos', roles: STAFF, icon: 'M3 7h18v10H3zM3 10h18M7 14h3' },
  { href: '/admin/reportes', label: 'Reportes', roles: STAFF, icon: 'M5 19V11m7 8V5m7 14v-6' },
  {
    href: '/admin/configuracion',
    label: 'Configuración',
    roles: ['OWNER'],
    icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  },
];

const ROLE_LABEL = { OWNER: 'Dueño', ADMIN: 'Administrador', PROFESSIONAL: 'Profesional' } as const;

/** Marco del panel: protege las rutas y da la navegación (lateral en escritorio, inferior en móvil). */
export function AdminShell({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const business = useBusiness();
  const isStaff = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const unread = useUnreadMessages(status === 'authenticated' && isStaff);
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (status === 'anonymous')
      router.replace(`/admin/login?volver=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);
  useEffect(() => setMore(false), [pathname]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <span className="eyebrow">Cargando…</span>
      </div>
    );
  }

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  const badge = (n: NavItem) => (n.badge === 'messages' && unread.data ? unread.data : 0);
  const tz = business.data?.timezone ?? 'America/Bogota';
  const mobileMain = items
    .filter((n) =>
      ['/admin', '/admin/calendario', '/admin/mensajes', '/admin/citas'].includes(n.href),
    )
    .slice(0, 3);
  const mobileMore = items.filter((n) => !mobileMain.includes(n));

  const link = (n: NavItem, onClick?: () => void) => (
    <Link
      href={n.href}
      onClick={onClick}
      aria-current={isActive(n.href) ? 'page' : undefined}
      className="text-stone hover:bg-paper-2 hover:text-ink aria-[current=page]:bg-paper-2 aria-[current=page]:text-ink flex h-10 items-center gap-3 rounded-xl px-3 transition-colors"
    >
      <NavIcon d={n.icon} />
      <span className="flex-1">{n.label}</span>
      {badge(n) > 0 && (
        <span
          className="tabular bg-accent rounded-full px-2 text-xs leading-5 text-white"
          aria-label={`${badge(n)} sin leer`}
        >
          {badge(n)}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      <aside className="border-line sticky top-0 hidden h-dvh flex-col border-r px-4 py-5 md:flex">
        <div className="flex items-center justify-between gap-2 px-1">
          <Link href="/admin" className="font-display truncate px-2 text-xl">
            {business.data?.name ?? 'Panel'}
          </Link>
          {isStaff && <NotificationsButton />}
        </div>
        <div className="mt-5 px-1">
          <GlobalSearch timezone={tz} />
        </div>
        <nav aria-label="Panel" className="mt-5 flex-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {items.map((n) => (
              <li key={n.href}>{link(n)}</li>
            ))}
          </ul>
        </nav>
        <div className="border-line border-t px-3 pt-4">
          <p className="truncate text-sm">{user.name}</p>
          <p className="text-stone text-xs">{ROLE_LABEL[user.role]}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <Link
              href="/"
              target="_blank"
              className="text-stone hover:text-ink underline-offset-2 hover:underline"
            >
              Ver web
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-stone hover:text-ink underline-offset-2 hover:underline"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior móvil */}
      <div className="border-line bg-paper/95 sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-2 backdrop-blur-sm md:hidden">
        <Link href="/admin" className="font-display truncate text-lg">
          {business.data?.name ?? 'Panel'}
        </Link>
        {isStaff && <NotificationsButton />}
      </div>

      <div className="min-w-0 pb-24 md:pb-0">{children}</div>

      <nav
        aria-label="Panel"
        className="border-line bg-paper/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-sm md:hidden"
      >
        <ul className="grid grid-cols-4">
          {mobileMain.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(n.href) ? 'page' : undefined}
                className="text-stone aria-[current=page]:text-ink relative flex h-16 flex-col items-center justify-center gap-1 text-xs"
              >
                <NavIcon d={n.icon} />
                {n.label}
                {badge(n) > 0 && (
                  <span
                    className="bg-accent absolute top-2 right-[30%] size-2 rounded-full"
                    aria-label="Mensajes sin leer"
                  />
                )}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-expanded={more}
              className="text-stone flex h-16 w-full flex-col items-center justify-center gap-1 text-xs"
            >
              <NavIcon d="M5 12h.01M12 12h.01M19 12h.01" />
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={more} onClose={() => setMore(false)} title="Menú">
        <div className="space-y-5">
          <GlobalSearch timezone={tz} onNavigate={() => setMore(false)} />
          <ul className="space-y-0.5">
            {mobileMore.map((n) => (
              <li key={n.href}>{link(n, () => setMore(false))}</li>
            ))}
          </ul>
          <div className="border-line border-t pt-4 text-sm">
            <p>{user.name}</p>
            <p className="text-stone text-xs">{ROLE_LABEL[user.role]}</p>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-stone mt-3 underline underline-offset-2"
            >
              Salir
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
