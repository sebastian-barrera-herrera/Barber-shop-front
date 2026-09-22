'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';

const LINKS = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/profesionales', label: 'Equipo' },
  { href: '/contacto', label: 'Contacto' },
];

export function Navbar({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`bg-paper/92 sticky top-0 z-40 backdrop-blur-sm transition-[border-color] duration-300 ${
        scrolled || open ? 'border-line border-b' : 'border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link href="/" className="font-display text-xl tracking-[0.02em]">
          {name}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? 'page' : undefined}
              className="text-stone hover:text-ink aria-[current=page]:text-ink text-[0.95rem] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {pathname !== '/reservar' && (
            <ButtonLink href="/reservar" variant="secondary" className="h-10">
              Reservar
            </ButtonLink>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {pathname !== '/reservar' && (
            <ButtonLink href="/reservar" className="h-10 px-4">
              Reservar
            </ButtonLink>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="flex size-10 items-center justify-center rounded-full"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 8h16M4 16h16'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-line border-t px-4 pb-6 md:hidden">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href} className="border-line border-b">
                <Link href={l.href} className="font-display flex h-14 items-center text-2xl">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
