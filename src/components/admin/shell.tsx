'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/admin/auth';
import { useBusiness } from '@/lib/admin/queries';

const NAV = [
  {
    href: '/admin',
    label: 'Hoy',
    icon: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1v-7.5Z',
  },
  {
    href: '/admin/calendario',
    label: 'Calendario',
    icon: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm-1 4h16M9 4v4m6-4v4',
  },
];

const ROLE_LABEL = { OWNER: 'Dueño', ADMIN: 'Administrador', PROFESSIONAL: 'Profesional' } as const;

/** Marco del panel: protege las rutas y da la navegación (lateral en escritorio, inferior en móvil). */
export function AdminShell({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const business = useBusiness();

  useEffect(() => {
    if (status === 'anonymous')
      router.replace(`/admin/login?volver=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <span className="eyebrow">Cargando…</span>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="border-line sticky top-0 hidden h-dvh flex-col border-r px-4 py-6 md:flex">
        <Link href="/admin" className="font-display px-3 text-xl">
          {business.data?.name ?? 'Panel'}
        </Link>
        <nav aria-label="Panel" className="mt-10 flex-1">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className="text-stone hover:bg-paper-2 hover:text-ink aria-[current=page]:bg-paper-2 aria-[current=page]:text-ink flex h-11 items-center gap-3 rounded-xl px-3 transition-colors"
                >
                  <NavIcon d={item.icon} />
                  {item.label}
                </Link>
              </li>
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

      <div className="min-w-0 pb-24 md:pb-0">{children}</div>

      <nav
        aria-label="Panel"
        className="border-line bg-paper/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-sm md:hidden"
      >
        <ul className="grid grid-cols-3">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className="text-stone aria-[current=page]:text-ink flex h-16 flex-col items-center justify-center gap-1 text-xs"
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-stone flex h-16 w-full flex-col items-center justify-center gap-1 text-xs"
            >
              <NavIcon d="M15 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3m-6-4h11m-3-3 3 3-3 3" />
              Salir
            </button>
          </li>
        </ul>
      </nav>
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
