import { Arrow, ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { siteHref } from '@/lib/site-paths';
import type { BusinessProfile, CatalogGroup, PublicProfessional } from '@/lib/types';
import { HouseRules } from './barber/house-rules';
import { SignHero } from './barber/sign-hero';
import { ServiceMenu } from './service-menu';
import { Team } from './team';
import { Visit } from './visit';

/** Portada de una barbería: letrero, carta de servicios, equipo y visita. */
export function BarberHome({
  business,
  groups,
  professionals,
}: {
  business: BusinessProfile;
  groups: CatalogGroup[];
  professionals: PublicProfessional[];
}) {
  const servicesCount = groups.reduce((n, g) => n + g.services.length, 0);

  return (
    <>
      <SignHero
        business={business}
        servicesCount={servicesCount}
        teamCount={professionals.length}
      />

      <section
        id="carta"
        aria-labelledby="carta-title"
        className="mx-auto mt-20 max-w-6xl scroll-mt-20 px-4 sm:px-6"
      >
        <SectionHeading index="01" eyebrow="La carta" title="Servicios y precios" id="carta-title">
          Precios finales. Toca cualquier servicio para reservarlo.
        </SectionHeading>
        <div className="mt-10">
          <ServiceMenu groups={groups} currency={business.currency} slug={business.slug} />
        </div>
      </section>

      <section aria-labelledby="casa-title" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <SectionHeading index="02" eyebrow="La casa" title="Cómo trabajamos" id="casa-title" />
        <div className="mt-10">
          <HouseRules />
        </div>
      </section>

      {professionals.length > 0 && (
        <section aria-labelledby="equipo-title" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
          <SectionHeading index="03" eyebrow="La silla" title="Quién te atiende" id="equipo-title">
            Elige a tu barbero o deja que te asignemos al primero disponible.
          </SectionHeading>
          <div className="mt-10">
            <Team professionals={professionals} slug={business.slug} />
          </div>
        </section>
      )}

      <section aria-labelledby="visita-title" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow="Visítanos"
          title="Horario y ubicación"
          id="visita-title"
        />
        <div className="mt-10">
          <Visit business={business} />
        </div>
      </section>

      <Reveal className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="border-accent/40 bg-paper-2 flex flex-col items-start justify-between gap-8 border px-6 py-12 md:flex-row md:items-center md:px-12">
          <div>
            <p className="font-display text-[clamp(1.9rem,4.5vw,3rem)] leading-[1]">
              ¿Te guardamos <span className="italic">la silla?</span>
            </p>
            <p className="text-stone mt-3">Reservar toma un minuto y no necesitas cuenta.</p>
          </div>
          <ButtonLink href={siteHref(business.slug, '/reservar')} size="lg">
            Reservar mi turno <Arrow />
          </ButtonLink>
        </div>
      </Reveal>
    </>
  );
}
