'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { siteHref } from '@/lib/site-paths';

type Device = 'phone' | 'desktop';

/**
 * "Mi web": la página real del negocio, tal como la ven sus clientes,
 * con el enlace para compartir. Se refresca cada vez que se abre.
 */
export function SitePreviewSection({ slug, name }: { slug: string; name: string }) {
  const toast = useToast();
  const [device, setDevice] = useState<Device>('desktop');
  const [reloads, setReloads] = useState(0);

  const path = siteHref(slug);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const url = `${origin}${path}`;
  const pretty = url.replace(/^https?:\/\//, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Enlace copiado. Pégalo en tu Instagram o en tu WhatsApp.');
    } catch {
      toast('Copia el enlace a mano: ' + pretty, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <section className="border-line rounded-2xl border p-5">
        <p className="eyebrow">Tu enlace</p>
        <p className="font-display mt-2 text-2xl break-all">{pretty}</p>
        <p className="text-stone mt-2 text-sm">
          Es la página de {name}. Compártela y tus clientes reservan desde ahí.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={copy}>Copiar enlace</Button>
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="border-ink/80 hover:bg-ink hover:text-paper inline-flex h-11 items-center rounded-[var(--radius-btn)] border px-5 text-[0.95rem]"
          >
            Abrir en una pestaña
          </a>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Así se ve</h2>
          <div className="flex items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Tamaño"
              className="border-line flex rounded-xl border p-1"
            >
              {(
                [
                  ['desktop', 'Computador'],
                  ['phone', 'Celular'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={device === value}
                  onClick={() => setDevice(value)}
                  className="text-stone aria-checked:bg-ink aria-checked:text-paper rounded-lg px-3 py-1.5 text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setReloads((n) => n + 1)}>
              Actualizar
            </Button>
          </div>
        </div>

        <div className="border-line bg-paper-2 flex justify-center rounded-2xl border p-4">
          <iframe
            key={`${device}-${reloads}`}
            src={path}
            title={`Vista previa de la página de ${name}`}
            loading="lazy"
            className={`bg-paper border-line rounded-xl border ${
              device === 'phone' ? 'h-[680px] w-[375px]' : 'h-[680px] w-full'
            }`}
          />
        </div>
        <p className="text-stone mt-3 text-sm">
          Los cambios de Apariencia, Horario y Servicios se ven aquí en menos de un minuto.
        </p>
      </section>
    </div>
  );
}
