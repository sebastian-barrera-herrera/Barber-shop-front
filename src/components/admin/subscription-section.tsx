'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  useSubscription,
  useSubscriptionCheckout,
  useVerifySubscription,
  type Subscription,
} from '@/lib/admin/hooks';
import { formatMoney } from '@/lib/format';

const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO';

const STATE: Record<Subscription['subscriptionStatus'], { label: string; tone: string }> = {
  TRIALING: { label: 'Prueba gratis', tone: 'bg-accent/15 text-accent' },
  ACTIVE: { label: 'Al día', tone: 'bg-[#3F8F5B]/15 text-[#3F8F5B]' },
  PAST_DUE: { label: 'Pago pendiente', tone: 'bg-[#A5473F]/15 text-[#A5473F]' },
  CANCELLED: { label: 'Cancelada', tone: 'bg-line text-stone' },
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

/** Configuración → Suscripción: cuánto tiempo queda y cómo pagar. */
export function SubscriptionSection() {
  const sub = useSubscription();
  const checkout = useSubscriptionCheckout();
  const verify = useVerifySubscription();
  const toast = useToast();
  const params = useSearchParams();
  const [plan, setPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Al volver de la pasarela, el servidor confirma el pago de verdad.
  const transactionId = params.get('id');
  const back = params.get('suscripcion') === '1';
  useEffect(() => {
    if (!back || !transactionId || verify.isPending || verify.isSuccess) return;
    verify.mutate(transactionId, {
      onSuccess: (s) =>
        toast(
          s.subscriptionStatus === 'ACTIVE'
            ? '¡Pago recibido! Tu plan está al día.'
            : 'Tu pago está en proceso. Te avisamos cuando se apruebe.',
        ),
      onError: (e) => toast(e.message, 'error'),
    });
  }, [back, transactionId, verify, toast]);

  if (!sub.data) return <div className="bg-paper-2 h-64 animate-pulse rounded-2xl" />;
  const s = sub.data;
  const state = STATE[s.subscriptionStatus];
  const trialing = s.subscriptionStatus === 'TRIALING';
  const blocked = s.subscriptionStatus === 'PAST_DUE' || s.subscriptionStatus === 'CANCELLED';

  const pay = () =>
    checkout.mutate(plan, {
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
      onError: (e) => toast(e.message, 'error'),
    });

  return (
    <div className="space-y-8">
      <section className="border-line rounded-2xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Tu plan con {PLATFORM}</p>
            <p className="font-display mt-2 text-3xl">
              {trialing
                ? `${s.daysLeft} ${s.daysLeft === 1 ? 'día' : 'días'} de prueba`
                : s.subscriptionStatus === 'ACTIVE'
                  ? `${s.daysLeft} ${s.daysLeft === 1 ? 'día' : 'días'} hasta la renovación`
                  : 'Tu plan está vencido'}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm ${state.tone}`}>{state.label}</span>
        </div>

        <p className="text-stone mt-4">
          {trialing
            ? `Tu prueba termina el ${fmtDate(s.trialEndsAt)}. Activa tu plan cuando quieras: los días que te quedan no se pierden.`
            : s.subscriptionStatus === 'ACTIVE'
              ? `Tu plan ${s.subscriptionPlan === 'YEARLY' ? 'anual' : 'mensual'} se renueva el ${fmtDate(s.currentPeriodEnd)}.`
              : 'Mientras no esté al día, el panel queda de solo lectura. Tu página sigue en línea y tus clientes pueden reservar.'}
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl">{blocked ? 'Activa tu plan' : 'Pagar mi plan'}</h2>
        <div role="radiogroup" aria-label="Plan" className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['MONTHLY', 'Mensual', 'al mes', null],
              ['YEARLY', 'Anual', 'al año', 'Dos meses de regalo'],
            ] as const
          ).map(([value, label, period, extra]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={plan === value}
              onClick={() => setPlan(value)}
              className="border-line aria-checked:border-ink aria-checked:ring-ink rounded-2xl border p-5 text-left aria-checked:ring-1"
            >
              <p className="eyebrow">{label}</p>
              <p className="font-display mt-2 text-3xl">
                {formatMoney(s.prices[value], 'COP')}{' '}
                <span className="text-stone font-sans text-sm">{period}</span>
              </p>
              {extra && <p className="text-accent mt-1 text-sm">{extra}</p>}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {s.canPayOnline ? (
            <Button size="lg" disabled={checkout.isPending} onClick={pay}>
              {checkout.isPending ? 'Abriendo el pago…' : 'Pagar ahora'}
            </Button>
          ) : (
            <p className="text-stone">
              Todavía no tenemos activado el cobro en línea. Escríbenos y activamos tu plan a mano.
            </p>
          )}
        </div>
      </section>

      {s.payments.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">Pagos</h2>
          <ul className="border-line mt-4 divide-y rounded-2xl border">
            {s.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3">
                <span>
                  Plan {p.plan === 'YEARLY' ? 'anual' : 'mensual'}
                  <span className="text-stone"> · {fmtDate(p.paidAt)}</span>
                </span>
                <span className="tabular">{formatMoney(p.amountCents, p.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
