import Link from 'next/link';
import type { BusinessStyle } from '@/lib/types';

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO';

/**
 * Barra de demostración: cuando alguien mira un negocio de ejemplo solo tiene dos caminos,
 * crear su cuenta o regresar. Nada de reservar en una barbería que no existe.
 */
export function DemoBar({ style }: { style: BusinessStyle }) {
  return (
    <div className="bg-brand text-on-brand sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="text-sm">Demostración de {PLATFORM}. Así se vería tu negocio.</p>
        <div className="flex items-center gap-2">
          <Link
            href={`/registro?estilo=${style === 'BARBER' ? 'barberia' : 'spa'}`}
            className="bg-ink text-paper hover:bg-ink/90 flex h-10 items-center rounded-[var(--radius-btn)] px-4 text-[0.95rem] font-medium"
          >
            Crear cuenta
          </Link>
          <Link
            href="/"
            className="border-on-brand/45 hover:bg-on-brand/10 flex h-10 items-center rounded-[var(--radius-btn)] border px-4 text-[0.95rem]"
          >
            Regresar
          </Link>
        </div>
      </div>
    </div>
  );
}
