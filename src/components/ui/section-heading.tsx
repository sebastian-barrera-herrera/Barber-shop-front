import type { ReactNode } from 'react';

/** Encabezado de sección estilo libreta: número, etiqueta y título. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  children,
  id,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <header className="border-ink/80 grid gap-6 border-t pt-5 md:grid-cols-[1fr_2fr] md:gap-10">
      <p className="eyebrow flex gap-3">
        <span className="tabular text-ink">{index}</span>
        <span>{eyebrow}</span>
      </p>
      <div>
        <h2
          id={id}
          className="font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02] font-light tracking-[-0.02em]"
        >
          {title}
        </h2>
        {children && (
          <p className="text-stone mt-4 max-w-xl text-[1.05rem] leading-relaxed">{children}</p>
        )}
      </div>
    </header>
  );
}
