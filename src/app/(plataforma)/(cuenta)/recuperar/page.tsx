'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Arrow, Button } from '@/components/ui/button';
import { platformApi } from '@/lib/api';

const field =
  'border-line bg-paper hover:border-stone focus:border-ink h-12 w-full rounded-[var(--radius-btn)] border px-4 text-base focus:outline-none';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Escribe tu correo');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await platformApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar el correo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-lg tracking-[0.18em]">
        {process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO'}
      </Link>
      <h1 className="font-display mt-8 text-[clamp(2.2rem,6vw,3.2rem)] leading-[1]">
        Recupera tu <span className="italic">contraseña</span>
      </h1>

      {sent ? (
        <div role="status" className="mt-6">
          <p className="text-stone">
            Si ese correo tiene una cuenta, le enviamos un enlace para elegir una contraseña nueva.
            Dura una hora y sirve una sola vez.
          </p>
          <p className="text-stone mt-4 text-sm">
            ¿No te llegó? Revisa el correo no deseado o{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-ink underline underline-offset-2"
            >
              inténtalo otra vez
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          <p className="text-stone">Te enviamos un enlace para elegir una nueva.</p>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm">
              Tu correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-btn)] border border-[#A5473F]/40 bg-[#A5473F]/[0.06] px-4 py-3 text-sm"
            >
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? (
              'Enviando…'
            ) : (
              <>
                Enviar el enlace <Arrow />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="text-stone mt-8 text-sm">
        <Link href="/entrar" className="text-ink underline underline-offset-2">
          Volver a entrar
        </Link>
      </p>
    </main>
  );
}
