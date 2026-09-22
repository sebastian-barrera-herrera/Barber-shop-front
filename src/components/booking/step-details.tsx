'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { Arrow, Button } from '@/components/ui/button';

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const STORAGE_KEY = 'studio:customer';

function loadSaved(): Partial<CustomerDetails> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function validate(d: CustomerDetails): Partial<Record<keyof CustomerDetails, string>> {
  const errors: Partial<Record<keyof CustomerDetails, string>> = {};
  if (d.name.trim().length < 2) errors.name = 'Escribe tu nombre';
  if (d.phone.replace(/\D/g, '').length < 7) errors.phone = 'Escribe un teléfono válido';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.email = 'Revisa el correo';
  return errors;
}

/** Paso 4: datos mínimos. Sin cuenta: nombre y teléfono. Se recuerdan en este dispositivo. */
export function StepDetails({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (details: CustomerDetails) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [values, setValues] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [remember, setRemember] = useState(true);
  const id = useId();

  useEffect(() => {
    const saved = loadSaved();
    if (saved.name || saved.phone) setValues((v) => ({ ...v, ...saved, notes: '' }));
  }, []);

  const set = (key: keyof CustomerDetails) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`${id}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    try {
      if (remember) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ name: values.name, phone: values.phone, email: values.email }),
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* almacenamiento no disponible: no pasa nada */
    }
    onSubmit(values);
  };

  const field = (
    key: keyof CustomerDetails,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-1.5 block text-sm">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        value={values[key]}
        onChange={set(key)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] || hint ? `${id}-${key}-msg` : undefined}
        className="border-line bg-paper placeholder:text-stone/60 hover:border-stone focus:border-ink h-12 w-full rounded-xl border px-4 text-base transition-colors focus:outline-none aria-[invalid=true]:border-[#A5473F]"
        {...props}
      />
      {(errors[key] || hint) && (
        <p
          id={`${id}-${key}-msg`}
          className={`mt-1.5 text-sm ${errors[key] ? 'text-[#A5473F]' : 'text-stone'}`}
        >
          {errors[key] ?? hint}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {field('name', 'Nombre', { autoComplete: 'name', placeholder: 'Juan Pérez', required: true })}
      {field(
        'phone',
        'Teléfono',
        {
          type: 'tel',
          inputMode: 'tel',
          autoComplete: 'tel',
          placeholder: '300 123 4567',
          required: true,
        },
        'Solo para avisarte sobre tu cita.',
      )}
      {field('email', 'Correo (opcional)', {
        type: 'email',
        autoComplete: 'email',
        placeholder: 'juan@correo.com',
      })}

      <div>
        <label htmlFor={`${id}-notes`} className="mb-1.5 block text-sm">
          ¿Algo que debamos saber? (opcional)
        </label>
        <textarea
          id={`${id}-notes`}
          value={values.notes}
          onChange={set('notes')}
          rows={2}
          maxLength={500}
          placeholder="Es mi primera vez, quiero un fade bajo…"
          className="border-line bg-paper placeholder:text-stone/60 hover:border-stone focus:border-ink w-full rounded-xl border px-4 py-3 text-base focus:outline-none"
        />
      </div>

      <label className="text-stone flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="size-4 accent-[var(--ink)]"
        />
        Recordar mis datos en este dispositivo
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#A5473F]/40 bg-[#A5473F]/[0.06] px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? (
          'Reservando…'
        ) : (
          <>
            Confirmar cita <Arrow />
          </>
        )}
      </Button>
    </form>
  );
}
