import { ButtonLink, Arrow } from '@/components/ui/button';
import { openStatus } from '@/lib/hours';
import { resolveTheme } from '@/lib/theme';
import type { BusinessProfile } from '@/lib/types';
import { HeroObject } from './hero-object';
import { HeroTitle } from './hero-title';

export function Hero({
  business,
  servicesCount,
  teamCount,
}: {
  business: BusinessProfile;
  servicesCount: number;
  teamCount: number;
}) {
  const theme = resolveTheme(business.branding);
  const status = openStatus(business.openingHours, business.timezone);

  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid gap-10 pt-10 pb-12 md:min-h-[min(78vh,760px)] md:grid-cols-[1.25fr_1fr] md:gap-12 md:pt-16">
        <div className="flex flex-col justify-between gap-12">
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
            {business.city && <span>{business.city}</span>}
            {business.city && <span aria-hidden className="bg-line h-px w-6" />}
            <span>Reservas en línea</span>
          </p>

          <div>
            <HeroTitle id="hero-title" text={business.branding.heroTitle} />
            <p className="text-stone mt-6 max-w-md text-lg leading-relaxed">
              {business.branding.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/reservar" size="lg">
                Reservar cita <Arrow />
              </ButtonLink>
              <ButtonLink href="#carta" size="lg" variant="secondary">
                Ver servicios
              </ButtonLink>
            </div>
          </div>

          {status.label && (
            <p className="text-stone flex items-center gap-2.5 text-sm">
              <span
                aria-hidden
                className={`size-2 rounded-full ${status.open ? 'bg-[#3F8F5B]' : 'bg-stone/50'}`}
              />
              {status.label}
            </p>
          )}
        </div>

        <figure className="border-line bg-paper-2 relative overflow-hidden rounded-[28px] border">
          <HeroObject theme={theme} animations={business.branding.animations} />
          <figcaption className="text-stone absolute inset-x-0 bottom-0 flex justify-between px-5 py-4 text-xs">
            <span className="tabular">N.º 01</span>
            <span>{business.name}</span>
          </figcaption>
        </figure>
      </div>

      <dl className="border-line grid grid-cols-3 border-y text-sm">
        {[
          [String(servicesCount), 'servicios'],
          [String(teamCount), teamCount === 1 ? 'profesional' : 'profesionales'],
          ['1 min', 'para reservar'],
        ].map(([value, label], i) => (
          <div
            key={label}
            className={`flex flex-col gap-0.5 py-4 sm:flex-row sm:items-baseline sm:gap-2 ${i ? 'border-line border-l pl-4' : ''}`}
          >
            <dt className="text-stone order-2">{label}</dt>
            <dd className="font-display tabular order-1 text-2xl">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
