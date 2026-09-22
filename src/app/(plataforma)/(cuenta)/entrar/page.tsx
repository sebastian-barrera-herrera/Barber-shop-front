'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Arrow, Button } from '@/components/ui/button';
import { useAuth } from '@/lib/admin/auth';

function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('volver')?.startsWith('/admin') ? params.get('volver')! : '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, next, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Escribe tu correo y tu contraseña');
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm">
          Correo
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-line bg-paper hover:border-stone focus:border-ink h-12 w-full rounded-xl border px-4 text-base focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-line bg-paper hover:border-stone focus:border-ink h-12 w-full rounded-xl border px-4 text-base focus:outline-none"
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#A5473F]/40 bg-[#A5473F]/[0.06] px-4 py-3 text-sm"
        >
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? (
          'Entrando…'
        ) : (
          <>
            Entrar <Arrow />
          </>
        )}
      </Button>
      <div className="text-stone flex flex-wrap justify-between gap-3 text-sm">
        <Link href="/recuperar" className="hover:text-ink underline underline-offset-2">
          Olvidé mi contraseña
        </Link>
        <Link href="/registro" className="hover:text-ink underline underline-offset-2">
          Crear mi página
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-16 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="font-display text-lg tracking-[0.18em]">
            {process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO'}
          </Link>
          <p className="eyebrow mt-8">Panel del negocio</p>
          <h1 className="font-display mt-3 text-5xl font-light tracking-[-0.02em]">
            Hola de nuevo
          </h1>
          <p className="text-stone mt-3">Entra para ver la agenda de hoy.</p>
          <div className="mt-10">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
      <aside
        aria-hidden
        className="border-line bg-paper-2 relative hidden overflow-hidden border-l md:block"
      >
        <div className="absolute inset-12 flex flex-col justify-between">
          <p className="eyebrow">Agenda</p>
          <div className="space-y-4">
            {['09:00', '10:30', '12:00', '15:30'].map((t, i) => (
              <div
                key={t}
                className="border-line flex items-baseline gap-5 border-b pb-4"
                style={{ opacity: 1 - i * 0.2 }}
              >
                <span className="tabular font-display text-3xl">{t}</span>
                <span className="bg-line h-px flex-1" />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
