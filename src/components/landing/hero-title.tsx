import { Fragment, type CSSProperties } from 'react';

/**
 * Título con entrada por máscara palabra a palabra. La última palabra va en cursiva y color de acento.
 * Es CSS puro (sin JavaScript): el título es lo primero que se pinta y no espera a que cargue la app.
 * Con "reducir movimiento" la regla global de globals.css deja la animación en ~0 ms.
 */
export function HeroTitle({ text, id }: { text: string; id: string }) {
  const words = text.trim().split(/\s+/);

  return (
    <h1
      id={id}
      className="font-display text-[clamp(2.9rem,8.2vw,6.4rem)] leading-[0.95] font-light tracking-[-0.035em]"
      style={{ fontVariationSettings: '"SOFT" 50, "opsz" 144' }}
    >
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span
              className={`animate-rise inline-block ${i === words.length - 1 ? 'text-accent pr-[0.06em] italic' : ''}`}
              style={{ animationDelay: `${80 + i * 60}ms` } as CSSProperties}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </h1>
  );
}
