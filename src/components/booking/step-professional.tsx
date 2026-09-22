'use client';

import { Avatar } from '@/components/ui/avatar';
import type { PublicProfessional } from '@/lib/types';

export const ANY = 'cualquiera';

/** Paso 2: con quién. "Me da igual" asigna al primero disponible. */
export function StepProfessional({
  professionals,
  selected,
  onSelect,
}: {
  professionals: PublicProfessional[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  if (!professionals.length) {
    return (
      <p className="text-stone">
        Por ahora nadie del equipo realiza este servicio en línea. Escríbenos y te ayudamos a
        agendar.
      </p>
    );
  }

  const option = (slug: string, content: React.ReactNode, label: string) => (
    <button
      key={slug}
      type="button"
      role="radio"
      aria-checked={selected === slug}
      aria-label={label}
      onClick={() => onSelect(slug)}
      className={`hover:border-ink flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
        selected === slug ? 'border-ink bg-paper-2' : 'border-line'
      }`}
    >
      {content}
    </button>
  );

  return (
    <div role="radiogroup" aria-label="Profesional" className="grid gap-3 sm:grid-cols-2">
      {option(
        ANY,
        <>
          <span
            aria-hidden
            className="border-stone/70 text-stone flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <circle cx="9" cy="9" r="3.2" />
              <circle cx="16" cy="10" r="2.6" />
              <path
                d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6M14.5 14.6c2.6-.3 4.9 1 5.8 4.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>
            <span className="block text-[1.05rem]">Me da igual</span>
            <span className="text-stone block text-sm">Te asignamos al primero disponible</span>
          </span>
        </>,
        'Me da igual, el primero disponible',
      )}
      {professionals.map((p) =>
        option(
          p.slug,
          <>
            <Avatar name={p.name} photoUrl={p.photoUrl} size={56} />
            <span className="min-w-0">
              <span className="block text-[1.05rem]">{p.name}</span>
              <span className="text-stone block truncate text-sm">
                {p.title ?? p.specialties.slice(0, 2).join(' · ')}
              </span>
            </span>
          </>,
          p.name,
        ),
      )}
    </div>
  );
}
