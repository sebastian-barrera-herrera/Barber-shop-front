'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import type { ThemeTokens } from '@/lib/theme';

const HeroCanvas = dynamic(() => import('./hero-canvas'), { ssr: false });

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Decide si vale la pena cargar Three.js. Nunca es necesario para usar la web:
 * sin WebGL, con "reducir movimiento" o con animaciones apagadas queda la forma estática.
 */
export function HeroObject({ theme, animations }: { theme: ThemeTokens; animations: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
    if (!animations || reduce || saveData || !canUseWebGL()) return;
    // Cargar después de que la página ya es usable.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const id = idle(() => setEnabled(true));
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
  }, [animations]);

  return (
    <div className="relative aspect-[4/5] w-full md:aspect-auto md:h-full">
      <StaticPebble
        className={`transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      {enabled && (
        <HeroCanvas
          material={theme.material}
          accent={theme.accent}
          paper={theme.paper2}
          onReady={onReady}
        />
      )}
    </div>
  );
}

/** Equivalente sin WebGL: la misma silueta en SVG. */
function StaticPebble({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      className={`absolute inset-0 m-auto h-[78%] w-[78%] ${className}`}
    >
      <defs>
        <radialGradient id="pebble-shade" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="var(--paper)" />
          <stop offset="55%" stopColor="var(--paper-2)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 35%, var(--paper-2))" />
        </radialGradient>
      </defs>
      <path
        d="M200 62c86 0 150 50 158 122 8 76-54 150-150 154-98 4-172-58-168-140C44 116 116 62 200 62Z"
        fill="url(#pebble-shade)"
        stroke="var(--line)"
      />
    </svg>
  );
}
