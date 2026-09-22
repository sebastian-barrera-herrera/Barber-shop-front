'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Animaciones: respetan "reducir movimiento" del sistema operativo. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  );
}
