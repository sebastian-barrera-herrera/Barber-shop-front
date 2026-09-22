'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { SitePreview } from '@/components/platform/site-preview';
import { StyleSwitch } from '@/components/platform/style-switch';
import { Arrow, Button } from '@/components/ui/button';
import { platformApi, type SlugCheck } from '@/lib/api';
import { registerBusiness } from '@/lib/admin/client';
import { resolveTheme, themeCss } from '@/lib/theme';
import type { BusinessStyle } from '@/lib/types';

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /^https?:\/\//,
  '',
);

const field =
  'border-line bg-paper hover:border-stone focus:border-ink h-12 w-full rounded-[var(--radius-btn)] border px-4 text-base focus:outline-none';

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-stone mt-1.5 text-xs" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function RegisterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [style, setStyle] = useState<BusinessStyle>(
    params.get('estilo') === 'spa' ? 'SPA' : 'BARBER',
  );
  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [check, setCheck] = useState<SlugCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // La dirección se propone desde el nombre y se comprueba mientras se escribe.
  const seq = useRef(0);
  useEffect(() => {
    const name = form.businessName.trim();
    const slug = form.slug.trim();
    if (!name && !slug) {
      setCheck(null);
      return;
    }
    const id = ++seq.current;
    const timer = setTimeout(() => {
      platformApi
        .checkSlug(slugEdited && slug ? { slug, name } : { name })
        .then((r) => {
          if (id !== seq.current) return;
          setCheck(r);
          if (!slugEdited) set('slug', r.available ? r.slug : r.suggestion);
        })
        .catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [form.businessName, form.slug, slugEdited]);

  const slugState = !form.slug ? null : check?.slug === form.slug ? check : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.businessName || !form.ownerName || !form.email || !form.password) {
      setError('Completa los datos que faltan');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setBusy(true);
    try {
      await registerBusiness({
        businessName: form.businessName.trim(),
        slug: form.slug.trim(),
        style,
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
      });
      router.replace('/admin?bienvenida=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear tu cuenta');
      setBusy(false);
    }
  };

  return (
    <div data-site-style={style === 'BARBER' ? 'barber' : 'spa'} className="contents">
      <style>{themeCss(resolveTheme(undefined, style))}</style>

      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-12 sm:px-6 md:grid-cols-[1fr_420px] md:py-16">
        <div>
          <Link href="/" className="font-display text-lg tracking-[0.18em]">
            {PLATFORM}
          </Link>
          <h1 className="font-display mt-8 text-[clamp(2.4rem,6vw,3.8rem)] leading-[1]">
            Crea tu página <span className="italic">de reservas</span>
          </h1>
          <p className="text-stone mt-4 max-w-md">
            En dos minutos tienes tu enlace para compartir y tu agenda lista.
          </p>

          <form onSubmit={submit} noValidate className="mt-10 max-w-md space-y-6">
            <fieldset>
              <legend className="mb-3 text-sm">¿Qué tipo de negocio es?</legend>
              <StyleSwitch value={style} onChange={setStyle} />
              <p className="text-stone mt-2 text-xs">
                Define el diseño de tu página y de tu panel. Después solo cambian los colores.
              </p>
            </fieldset>

            <Field id="businessName" label="Nombre del negocio">
              <input
                id="businessName"
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
                autoComplete="organization"
                className={field}
              />
            </Field>

            <Field id="slug" label="La dirección de tu página">
              <div className="border-line bg-paper focus-within:border-ink flex h-12 items-center rounded-[var(--radius-btn)] border px-4">
                <span className="text-stone shrink-0 text-sm">{SITE}/</span>
                <input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  aria-describedby="slug-estado"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
              <p id="slug-estado" role="status" className="mt-1.5 text-xs">
                {!slugState ? (
                  <span className="text-stone">Así te encontrarán tus clientes.</span>
                ) : slugState.available ? (
                  <span className="text-accent">Libre. Es tuya.</span>
                ) : (
                  <span>
                    {slugState.reason}.{' '}
                    <button
                      type="button"
                      onClick={() => set('slug', slugState.suggestion)}
                      className="underline underline-offset-2"
                    >
                      Usar {slugState.suggestion}
                    </button>
                  </span>
                )}
              </p>
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="ownerName" label="Tu nombre">
                <input
                  id="ownerName"
                  value={form.ownerName}
                  onChange={(e) => set('ownerName', e.target.value)}
                  autoComplete="name"
                  className={field}
                />
              </Field>
              <Field id="city" label="Ciudad (opcional)">
                <input
                  id="city"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  autoComplete="address-level2"
                  className={field}
                />
              </Field>
            </div>

            <Field id="email" label="Tu correo" hint="Aquí llegan los avisos de tus reservas.">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
                className={field}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="password" label="Contraseña" hint="Mínimo 8 caracteres.">
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="new-password"
                  className={field}
                />
              </Field>
              <Field id="phone" label="WhatsApp (opcional)">
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  autoComplete="tel"
                  className={field}
                />
              </Field>
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
                'Creando tu página…'
              ) : (
                <>
                  Crear mi página <Arrow />
                </>
              )}
            </Button>

            <p className="text-stone text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/entrar" className="text-ink underline underline-offset-2">
                Entra aquí
              </Link>
            </p>
          </form>
        </div>

        <aside className="hidden md:block">
          <p className="eyebrow mb-4">Así queda tu página</p>
          <SitePreview style={style} />
        </aside>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
