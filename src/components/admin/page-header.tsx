import type { ReactNode } from 'react';

/** Encabezado común de las páginas del panel: título, una línea de ayuda y la acción principal. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-none font-light tracking-[-0.02em]">
          {title}
        </h1>
        {description && <p className="text-stone mt-3 max-w-xl">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/** Contenedor estándar de página. */
export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto px-4 py-8 sm:px-8 md:py-10 ${wide ? '' : 'max-w-6xl'}`}>
      {children}
    </main>
  );
}

/** Aviso de "no tienes acceso" en lenguaje claro. */
export function NoAccess({ who = 'el dueño del negocio' }: { who?: string }) {
  return (
    <PageShell>
      <div className="border-line rounded-2xl border border-dashed px-6 py-12 text-center">
        <p className="font-display text-2xl">Esta sección es solo para {who}</p>
        <p className="text-stone mt-2">
          Si necesitas cambiar algo aquí, pídeselo a quien administra la cuenta.
        </p>
      </div>
    </PageShell>
  );
}

/** Estado vacío: una invitación, no una disculpa. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-line rounded-2xl border border-dashed px-6 py-12 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="text-stone mx-auto mt-2 max-w-md">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
