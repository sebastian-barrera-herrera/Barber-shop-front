import type { Metadata } from 'next';
import { Team } from '@/components/landing/team';
import { publicApi, safely } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Equipo',
  description: 'Conoce a nuestros profesionales y reserva con quien prefieras.',
  alternates: { canonical: '/profesionales' },
};

export default async function TeamPage() {
  const team = (await safely(() => publicApi.professionals(undefined, 60))) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 md:pt-20">
      <p className="eyebrow">El equipo</p>
      <h1 className="font-display mt-3 text-[clamp(2.6rem,7vw,5rem)] leading-[0.98] font-light tracking-[-0.03em]">
        Quién te atiende
      </h1>
      <p className="text-stone mt-5 max-w-xl text-lg">
        Elige a tu profesional al reservar, o deja que te asignemos al primero disponible.
      </p>
      <div className="mt-14">
        {team.length ? (
          <Team professionals={team} />
        ) : (
          <p className="text-stone">Muy pronto presentaremos al equipo.</p>
        )}
      </div>
    </div>
  );
}
