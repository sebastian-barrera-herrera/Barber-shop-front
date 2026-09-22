'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SitePreview } from '@/components/platform/site-preview';
import { StyleSwitch } from '@/components/platform/style-switch';
import { Arrow, ButtonLink } from '@/components/ui/button';
import { resolveTheme, themeCss } from '@/lib/theme';
import type { BusinessStyle } from '@/lib/types';

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO';

const COPY: Record<
  BusinessStyle,
  { eyebrow: string; title: string[]; lead: string; demo: string; demoLabel: string }
> = {
  BARBER: {
    eyebrow: 'Para barberías',
    title: ['Tu silla', 'siempre llena'],
    lead: 'Tus clientes reservan desde su teléfono, a cualquier hora. Tú ves la agenda del día y sigues cortando.',
    demo: '/barberia-demo',
    demoLabel: 'Ver una barbería de ejemplo',
  },
  SPA: {
    eyebrow: 'Para spas y centros de belleza',
    title: ['Tu agenda', 'sin llamadas'],
    lead: 'Tus clientes reservan desde su teléfono, a cualquier hora. Tú ves la agenda del día y sigues atendiendo.',
    demo: '/studio-demo',
    demoLabel: 'Ver un spa de ejemplo',
  },
};

const FEATURES = [
  [
    'Tu página de reservas',
    'Con tus servicios, tu equipo, tus precios y tu horario. Lista al registrarte.',
  ],
  [
    'Agenda que se ordena sola',
    'Día, semana o mes. Arrastra una cita para moverla y avisamos al cliente.',
  ],
  [
    'Correos automáticos',
    'Confirmación, cambio de hora, cancelación y recordatorios de 24 h y 2 h.',
  ],
  ['Cobros en línea', 'Conecta Wompi y cobra al reservar, con anticipo o sin cobro. Tú decides.'],
  [
    'Clientes y su historia',
    'Quién vino, cuánto gastó y cuándo fue la última vez. Sin duplicados.',
  ],
  ['Chat con el cliente', 'Responde dudas desde el panel, en la misma conversación de su cita.'],
];

const STEPS = [
  ['Crea tu cuenta', 'Nombre del negocio, tu correo y listo. Dos minutos.'],
  ['Revisa tu carta', 'Dejamos servicios y horario de ejemplo: ajústalos a lo tuyo.'],
  ['Comparte tu enlace', 'Ponlo en Instagram, en WhatsApp y en tu puerta. Las citas entran solas.'],
];

export default function PlatformHome() {
  const [style, setStyle] = useState<BusinessStyle>('BARBER');
  const copy = COPY[style];
  const theme = resolveTheme(undefined, style);

  return (
    <div data-site-style={style === 'BARBER' ? 'barber' : 'spa'} className="contents">
      <style>{themeCss(theme)}</style>

      <header className="border-line sticky top-0 z-40 border-b backdrop-blur-sm">
        <nav
          aria-label="Principal"
          className="bg-paper/90 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <Link href="/" className="font-display text-xl tracking-[0.18em]">
            {PLATFORM}
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/entrar" className="text-stone hover:text-ink px-2 text-[0.95rem]">
              Entrar
            </Link>
            <ButtonLink href={`/registro?estilo=${style === 'BARBER' ? 'barberia' : 'spa'}`}>
              Crear mi página
            </ButtonLink>
          </div>
        </nav>
      </header>

      <main id="contenido">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-8 sm:px-6 md:grid-cols-[1.05fr_1fr] md:items-center md:pt-20">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className="font-display mt-4 text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.95]">
              {copy.title[0]} <span className="italic">{copy.title[1]}</span>
            </h1>
            <p className="text-stone mt-6 max-w-md text-lg">{copy.lead}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={`/registro?estilo=${style === 'BARBER' ? 'barberia' : 'spa'}`}
                size="lg"
              >
                Crear mi página <Arrow />
              </ButtonLink>
              <ButtonLink href={copy.demo} size="lg" variant="secondary">
                {copy.demoLabel}
              </ButtonLink>
            </div>

            <div className="mt-10">
              <p className="text-stone mb-3 text-sm">¿Qué tipo de negocio tienes?</p>
              <StyleSwitch value={style} onChange={setStyle} />
              <p className="text-stone mt-3 text-sm">
                Así se verá tu página y tu panel. El diseño queda fijo al crear tu cuenta.
              </p>
            </div>
          </div>

          <SitePreview style={style} />
        </section>

        <section
          aria-labelledby="incluye"
          className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 md:pt-28"
        >
          <p className="eyebrow">Qué incluye</p>
          <h2
            id="incluye"
            className="font-display mt-3 text-[clamp(2rem,5vw,3.4rem)] leading-[1.02]"
          >
            Todo lo del mostrador, <span className="italic">en tu bolsillo</span>
          </h2>
          <ul className="mt-12 grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, text], i) => (
              <li
                key={title}
                className="border-line bg-paper relative border-t p-6 first:border-t sm:p-7"
              >
                <span className="text-stone tabular text-xs">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display mt-3 text-2xl">{title}</h3>
                <p className="text-stone mt-2 text-[0.95rem] leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pasos" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
          <p className="eyebrow">Cómo empiezas</p>
          <h2 id="pasos" className="font-display mt-3 text-[clamp(2rem,5vw,3.4rem)] leading-[1.02]">
            Hoy mismo, <span className="italic">sin instalar nada</span>
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="border-line border-t pt-5">
                <span className="font-display text-accent text-4xl">{i + 1}</span>
                <h3 className="font-display mt-2 text-2xl">{title}</h3>
                <p className="text-stone mt-2 text-[0.95rem]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 pb-24 sm:px-6">
          <div className="bg-ink text-paper flex flex-col items-start justify-between gap-8 rounded-[var(--radius-card)] px-6 py-12 md:flex-row md:items-end md:px-12 md:py-16">
            <p className="font-display max-w-lg text-[clamp(2rem,5vw,3.4rem)] leading-[1]">
              ¿Abrimos tu agenda <span className="italic">esta semana?</span>
            </p>
            <ButtonLink
              href={`/registro?estilo=${style === 'BARBER' ? 'barberia' : 'spa'}`}
              size="lg"
              className="bg-paper text-ink hover:bg-paper/90"
            >
              Crear mi página <Arrow />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-line text-stone border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6">
          <span className="font-display text-ink text-lg tracking-[0.18em]">{PLATFORM}</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/entrar" className="hover:text-ink">
              Entrar
            </Link>
            <Link href="/registro" className="hover:text-ink">
              Crear mi página
            </Link>
          </div>
          <span>
            © {new Date().getFullYear()} {PLATFORM}
          </span>
        </div>
      </footer>
    </div>
  );
}
