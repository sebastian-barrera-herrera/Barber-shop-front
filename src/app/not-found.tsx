import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center px-6">
      <p className="eyebrow">404</p>
      <h1 className="font-display mt-3 text-5xl font-light">No encontramos esta página</h1>
      <p className="text-stone mt-4">
        Si llegaste desde un enlace de tu cita, revisa que esté completo.
      </p>
      <div className="mt-8">
        <ButtonLink href="/">Ir al inicio</ButtonLink>
      </div>
    </main>
  );
}
