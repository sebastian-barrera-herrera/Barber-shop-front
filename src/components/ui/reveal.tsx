import type { ReactNode } from 'react';

/**
 * Aparición suave al entrar en pantalla, con animación CSS ligada al scroll.
 * No depende de JavaScript: sin soporte del navegador (o con "reducir movimiento"),
 * el contenido simplemente está visible.
 */
export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  /** Se mantiene por compatibilidad; el escalonado lo da la posición en pantalla. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  return <Tag className={`reveal ${className}`}>{children}</Tag>;
}
