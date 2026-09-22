import { siteHref } from '@/lib/site-paths';
import Image from 'next/image';
import Link from 'next/link';
import { Arrow } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import type { PublicProfessional } from '@/lib/types';

/** Retratos del equipo. Sin foto, la inicial en grande hace de retrato tipográfico. */
export function Team({
  professionals,
  slug,
}: {
  professionals: PublicProfessional[];
  slug: string;
}) {
  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {professionals.map((p, i) => (
        <Reveal as="li" key={p.id} delay={Math.min(i, 3) * 0.06}>
          <article>
            <div className="border-line bg-paper-2 relative aspect-[4/5] overflow-hidden rounded-[22px] border">
              {p.photoUrl ? (
                <Image
                  src={p.photoUrl}
                  alt={`Foto de ${p.name}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="font-display text-ink/85 absolute inset-0 flex items-center justify-center text-[9rem] leading-none font-light italic"
                >
                  {p.name[0]}
                </span>
              )}
              {p.specialties.length > 0 && (
                <ul
                  className="absolute inset-x-4 bottom-4 flex flex-wrap gap-1.5"
                  aria-label="Especialidades"
                >
                  {p.specialties.slice(0, 3).map((s) => (
                    <li key={s} className="bg-paper/90 text-ink rounded-full px-3 py-1 text-xs">
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
                {p.title && <p className="text-stone">{p.title}</p>}
              </div>
              <Link
                href={`${siteHref(slug, '/reservar')}?con=${p.slug}`}
                className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
                aria-label={`Reservar con ${p.name}`}
              >
                Reservar <Arrow />
              </Link>
            </div>
            {p.bio && (
              <p className="text-stone mt-2 max-w-sm text-[0.95rem] leading-relaxed">{p.bio}</p>
            )}
          </article>
        </Reveal>
      ))}
    </ul>
  );
}
