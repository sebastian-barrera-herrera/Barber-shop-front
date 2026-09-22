import { Hero } from '@/components/landing/hero';
import { BusinessJsonLd } from '@/components/landing/json-ld';
import { ServiceMenu } from '@/components/landing/service-menu';
import { Steps } from '@/components/landing/steps';
import { Team } from '@/components/landing/team';
import { Unavailable } from '@/components/landing/unavailable';
import { Visit } from '@/components/landing/visit';
import { Arrow, ButtonLink } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { publicApi, safely } from '@/lib/api';

export const revalidate = 60;

export default async function HomePage() {
  const [business, catalog, team] = await Promise.all([
    safely(publicApi.business),
    safely(publicApi.catalog),
    safely(() => publicApi.professionals(undefined, 60)),
  ]);
  if (!business) return <Unavailable />;
  const groups = catalog ?? [];
  const professionals = team ?? [];
  const servicesCount = groups.reduce((n, g) => n + g.services.length, 0);

  return (
    <>
      <BusinessJsonLd
        business={business}
        catalog={groups}
        url={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}
      />
      <Hero business={business} servicesCount={servicesCount} teamCount={professionals.length} />

      <section
        id="carta"
        aria-labelledby="carta-title"
        className="mx-auto mt-24 max-w-6xl scroll-mt-20 px-4 sm:px-6"
      >
        <SectionHeading index="01" eyebrow="La carta" title="Servicios y precios" id="carta-title">
          Precios finales, sin sorpresas. Toca cualquier servicio para reservarlo.
        </SectionHeading>
        <div className="mt-12">
          <ServiceMenu groups={groups} currency={business.currency} />
        </div>
      </section>

      {professionals.length > 0 && (
        <section aria-labelledby="equipo-title" className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
          <SectionHeading index="02" eyebrow="El equipo" title="Quién te atiende" id="equipo-title">
            Puedes elegir a tu profesional o dejar que te asignemos al primero disponible.
          </SectionHeading>
          <div className="mt-12">
            <Team professionals={professionals} />
          </div>
        </section>
      )}

      <section aria-labelledby="como-title" className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="03"
          eyebrow="Cómo reservar"
          title="Te toma un minuto"
          id="como-title"
        />
        <div className="mt-12">
          <Steps />
        </div>
      </section>

      <section aria-labelledby="visita-title" className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow="Visítanos"
          title="Horario y ubicación"
          id="visita-title"
        />
        <div className="mt-12">
          <Visit business={business} />
        </div>
      </section>

      <Reveal className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <div className="bg-ink text-paper flex flex-col items-start justify-between gap-8 rounded-[28px] px-6 py-12 md:flex-row md:items-end md:px-12 md:py-16">
          <p className="font-display max-w-lg text-[clamp(2.2rem,5vw,3.8rem)] leading-[1] font-light tracking-[-0.02em]">
            ¿Te guardamos <span className="italic">un lugar?</span>
          </p>
          <ButtonLink href="/reservar" size="lg" className="bg-paper text-ink hover:bg-paper/90">
            Reservar cita <Arrow />
          </ButtonLink>
        </div>
      </Reveal>
    </>
  );
}
