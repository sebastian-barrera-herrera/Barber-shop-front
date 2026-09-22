import Link from 'next/link';
import { Arrow, ButtonLink } from '@/components/ui/button';
import type { BusinessStyle } from '@/lib/types';

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO';

/** En una demostración no se reserva: solo se crea la cuenta o se regresa. */
export function DemoNotice({ style }: { style: BusinessStyle }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center px-4 py-16 sm:px-6">
      <p className="eyebrow">Demostración</p>
      <h1 className="font-display mt-3 text-[clamp(2.2rem,6vw,3.6rem)] leading-[1]">
        Este negocio es <span className="italic">de muestra</span>
      </h1>
      <p className="text-stone mt-5">
        Aquí no hay citas de verdad. Crea tu cuenta y en dos minutos tienes esta misma página con tu
        nombre, tus servicios y tu horario: 14 días gratis.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <ButtonLink href={`/registro?estilo=${style === 'BARBER' ? 'barberia' : 'spa'}`} size="lg">
          Crear cuenta <Arrow />
        </ButtonLink>
        <Link
          href="/"
          className="border-ink/80 hover:bg-ink hover:text-paper flex h-13 items-center rounded-[var(--radius-btn)] border px-7"
        >
          Regresar a {PLATFORM}
        </Link>
      </div>
    </div>
  );
}
