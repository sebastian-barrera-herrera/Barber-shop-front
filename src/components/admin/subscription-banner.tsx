'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/admin/auth';
import { useSubscription } from '@/lib/admin/hooks';

/**
 * Aviso del plan: aparece solo cuando importa (pocos días de prueba o pago vencido)
 * y solo al dueño, que es quien puede pagar.
 */
export function SubscriptionBanner() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const sub = useSubscription(isOwner);
  if (!isOwner || !sub.data) return null;

  const s = sub.data;
  const overdue = s.subscriptionStatus === 'PAST_DUE' || s.subscriptionStatus === 'CANCELLED';
  const ending = s.subscriptionStatus === 'TRIALING' && s.daysLeft <= 5;
  if (!overdue && !ending) return null;

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6 ${
        overdue ? 'bg-[#A5473F] text-white' : 'bg-paper-2 border-line border-b'
      }`}
    >
      <p>
        {overdue
          ? 'Tu plan está vencido: puedes ver tu agenda, pero no cambiar nada. Tu página sigue recibiendo reservas.'
          : s.daysLeft === 0
            ? 'Hoy termina tu prueba gratis.'
            : `Te ${s.daysLeft === 1 ? 'queda' : 'quedan'} ${s.daysLeft} ${s.daysLeft === 1 ? 'día' : 'días'} de prueba.`}
      </p>
      <Link
        href="/admin/configuracion?seccion=suscripcion"
        className={`rounded-[var(--radius-btn)] px-4 py-1.5 font-medium ${
          overdue ? 'bg-white text-[#A5473F]' : 'bg-ink text-paper'
        }`}
      >
        {overdue ? 'Activar mi plan' : 'Ver mi plan'}
      </Link>
    </div>
  );
}
