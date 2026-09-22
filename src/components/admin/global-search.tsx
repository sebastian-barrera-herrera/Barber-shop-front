'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { STATUS } from '@/components/ui/status-badge';
import { formatMoney, prettyPhone } from '@/lib/format';
import { useSearch } from '@/lib/admin/hooks';

/** Buscador del panel: clientes, citas, profesionales y servicios. Atajo: "/". */
export function GlobalSearch({
  timezone,
  onNavigate,
}: {
  timezone: string;
  onNavigate?: () => void;
}) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const results = useSearch(debounced);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const r = results.data;
  const total = r
    ? r.customers.length + r.appointments.length + r.professionals.length + r.services.length
    : 0;
  const done = () => {
    setOpen(false);
    setQ('');
    onNavigate?.();
  };
  const when = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <li>
      <p className="eyebrow px-3 pt-3 pb-1">{title}</p>
      <ul>{children}</ul>
    </li>
  );
  const Item = ({
    href,
    primary,
    secondary,
  }: {
    href: string;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
  }) => (
    <li>
      <Link
        href={href}
        onClick={done}
        className="hover:bg-paper-2 flex items-baseline justify-between gap-3 rounded-lg px-3 py-2"
      >
        <span className="truncate">{primary}</span>
        {secondary && <span className="text-stone shrink-0 text-xs">{secondary}</span>}
      </Link>
    </li>
  );

  return (
    <div ref={box} className="relative">
      <label htmlFor={id} className="sr-only">
        Buscar
      </label>
      <input
        ref={input}
        id={id}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar…  /"
        autoComplete="off"
        className="border-line bg-paper placeholder:text-stone/70 focus:border-ink h-10 w-full rounded-xl border px-3 text-sm focus:outline-none"
      />
      {open && debounced.length >= 2 && (
        <div className="border-line bg-paper absolute inset-x-0 top-12 z-50 max-h-[70vh] min-w-[300px] overflow-y-auto rounded-xl border p-1 shadow-xl">
          {results.isLoading && <p className="text-stone px-3 py-3 text-sm">Buscando…</p>}
          {r && total === 0 && (
            <p className="text-stone px-3 py-3 text-sm">Sin resultados para “{debounced}”.</p>
          )}
          {r && total > 0 && (
            <ul>
              {r.customers.length > 0 && (
                <Group title="Clientes">
                  {r.customers.map((c) => (
                    <Item
                      key={c.id}
                      href={`/admin/clientes?id=${c.id}`}
                      primary={c.name}
                      secondary={prettyPhone(c.phone)}
                    />
                  ))}
                </Group>
              )}
              {r.appointments.length > 0 && (
                <Group title="Citas">
                  {r.appointments.map((a) => (
                    <Item
                      key={a.id}
                      href={`/admin/citas?id=${a.id}`}
                      primary={
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={`size-1.5 rounded-full ${STATUS[a.status].dot}`}
                          />
                          {a.customer.name} · {a.serviceNameSnapshot}
                        </span>
                      }
                      secondary={when(a.startsAt)}
                    />
                  ))}
                </Group>
              )}
              {r.professionals.length > 0 && (
                <Group title="Profesionales">
                  {r.professionals.map((p) => (
                    <Item
                      key={p.id}
                      href={`/admin/profesionales?id=${p.id}`}
                      primary={p.name}
                      secondary={p.title}
                    />
                  ))}
                </Group>
              )}
              {r.services.length > 0 && (
                <Group title="Servicios">
                  {r.services.map((s) => (
                    <Item
                      key={s.id}
                      href={`/admin/servicios?id=${s.id}`}
                      primary={s.name}
                      secondary={formatMoney(s.priceCents)}
                    />
                  ))}
                </Group>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
