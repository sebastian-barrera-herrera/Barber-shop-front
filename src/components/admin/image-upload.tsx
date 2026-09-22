'use client';

import { useId, useRef, useState } from 'react';
import { uploadImage } from '@/lib/admin/hooks';

/** Subir una imagen (logo, foto). Muestra la vista previa y permite quitarla. */
export function ImageUpload({
  label,
  value,
  onChange,
  shape = 'square',
  hint = 'JPG, PNG o WebP, máximo 3 MB.',
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  shape?: 'square' | 'round' | 'wide';
  hint?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return setError('La imagen pesa más de 3 MB');
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos subir la imagen');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const frame =
    shape === 'round'
      ? 'size-20 rounded-full'
      : shape === 'wide'
        ? 'h-24 w-40 rounded-xl'
        : 'size-20 rounded-xl';

  return (
    <div>
      <p id={`${id}-label`} className="mb-1.5 text-sm">
        {label}
      </p>
      <div className="flex items-center gap-4">
        <div className={`${frame} border-line bg-paper-2 shrink-0 overflow-hidden border`}>
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-stone flex size-full items-center justify-center text-xs">
              Sin imagen
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-labelledby={`${id}-label`}
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <label
            htmlFor={id}
            className="border-line hover:border-ink cursor-pointer rounded-full border px-4 py-2 text-sm"
          >
            {busy ? 'Subiendo…' : value ? 'Cambiar' : 'Subir imagen'}
          </label>
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-stone text-xs underline underline-offset-2"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
      <p
        className={`mt-1.5 text-xs ${error ? 'text-[#A5473F]' : 'text-stone'}`}
        role={error ? 'alert' : undefined}
      >
        {error ?? hint}
      </p>
    </div>
  );
}
