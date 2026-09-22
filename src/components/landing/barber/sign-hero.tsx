import { Arrow, ButtonLink } from '@/components/ui/button';
import { openStatus } from '@/lib/hours';
import { siteHref } from '@/lib/site-paths';
import type { BusinessProfile } from '@/lib/types';
import { Crest } from './crest';

/**
 * Portada del estilo barbería: un letrero pintado a mano.
 * La última palabra del título va en manuscrita, como el rótulo de una vitrina antigua.
 */
export function SignHero({
  business,
  servicesCount,
  teamCount,
}: {
  business: BusinessProfile;
  servicesCount: number;
  teamCount: number;
}) {
  const status = openStatus(business.openingHours, business.timezone);
  // El título va entero en el letrero; arriba, el saludo en manuscrita, como en una vitrina.
  const title = business.branding.heroTitle.trim().replace(/\.$/, '');

  return (
    <section aria-labelledby="hero-title" className="border-line border-b">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-14 sm:px-6 md:grid-cols-[1.35fr_0.65fr] md:items-center md:pt-16">
        <div>
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
            {business.city && <span>{business.city}</span>}
            {business.city && <span aria-hidden className="bg-line h-px w-6" />}
            <span>Reserva en línea</span>
          </p>

          <h1 id="hero-title" className="mt-6">
            <span
              className="text-accent block text-[clamp(1.8rem,4.5vw,2.8rem)] leading-none"
              style={{ fontFamily: 'var(--font-script)' }}
            >
              Bienvenido
            </span>
            <span
              className="font-display mt-1 block text-[clamp(2.8rem,9vw,6rem)] leading-[0.92] font-extrabold"
              style={{
                textShadow:
                  '0 2px 0 color-mix(in srgb, var(--ink) 18%, transparent), 0 4px 14px color-mix(in srgb, #000 35%, transparent)',
              }}
            >
              {title}
            </span>
          </h1>

          <p className="text-stone mt-6 max-w-md text-lg leading-relaxed">
            {business.branding.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={siteHref(business.slug, '/reservar')} size="lg">
              Reservar mi turno <Arrow />
            </ButtonLink>
            <ButtonLink href="#carta" size="lg" variant="secondary">
              Ver la carta
            </ButtonLink>
          </div>

          <ul className="text-stone mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {status.label && (
              <li className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${status.open ? 'bg-[#5FA97A]' : 'bg-stone/50'}`}
                />
                {status.label}
              </li>
            )}
            <li>
              {servicesCount} {servicesCount === 1 ? 'servicio' : 'servicios'}
            </li>
            <li>
              {teamCount} {teamCount === 1 ? 'barbero' : 'barberos'}
            </li>
            <li>Sin llamadas</li>
          </ul>
        </div>

        <div className="flex justify-center md:justify-end">
          <Crest name={business.name} city={business.city} className="w-40 md:w-56" />
        </div>
      </div>
    </section>
  );
}
