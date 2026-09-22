'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Arrow, Button } from '@/components/ui/button';
import { platformApi } from '@/lib/api';
import { useAuth } from '@/lib/admin/auth';

const field =
  'border-line bg-paper hover:border-stone focus:border-ink h-12 w-full rounded-[var(--radius-btn)] border px-4 text-base focus:outline-none';

/** El profesional llega aquí desde el correo del negocio y elige su contraseña. */
function InvitationForm() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="text-stone mt-8">
        Este enlace está incompleto. Pídele al negocio que te reenvíe la invitación.
      </p>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setBusy(true);
    try {
      await platformApi.resetPassword(token, password);
      if (email.trim()) await login(email.trim(), password).catch(() => undefined);
      router.replace(email.trim() ? '/admin' : '/entrar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear tu contraseña');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-5">
      <p className="text-stone">
        Desde el panel ves tus citas, tu calendario y tu horario, desde el celular o el computador.
      </p>
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
        <p className="text-stone mt-1.5 text-xs">El mismo al que llegó la invitación.</p>
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm">
          Tu contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
        <p className="text-stone mt-1.5 text-xs">Mínimo 8 caracteres. Solo tú la conoces.</p>
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
          'Entrando…'
        ) : (
          <>
            Crear mi contraseña y entrar <Arrow />
          </>
        )}
      </Button>
    </form>
  );
}

export default function InvitationPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-lg tracking-[0.18em]">
        {process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO'}
      </Link>
      <p className="eyebrow mt-8">Te invitaron al panel</p>
      <h1 className="font-display mt-3 text-[clamp(2.2rem,6vw,3.2rem)] leading-[1]">
        Crea tu <span className="italic">contraseña</span>
      </h1>
      <Suspense>
        <InvitationForm />
      </Suspense>
    </main>
  );
}
