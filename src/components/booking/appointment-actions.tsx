'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, buttonClass } from '@/components/ui/button';
import { publicApi } from '@/lib/api';
import { formatLongDate, formatTime, whatsappLink } from '@/lib/format';
import { buildIcs, downloadIcs } from '@/lib/ics';
import type { BusinessProfile, PublicAppointment } from '@/lib/types';

/** Agregar al calendario, escribir al negocio, copiar el enlace y cancelar. */
export function AppointmentActions({
  appointment: a,
  business,
  token,
}: {
  appointment: PublicAppointment;
  business: BusinessProfile;
  token: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const active = a.status === 'PENDING' || a.status === 'CONFIRMED';
  const whatsapp = business.whatsapp ?? business.social.whatsapp;
  const when = `${formatLongDate(a.startsAt, a.timezone)} a las ${formatTime(a.startsAt, a.timezone)}`;

  const addToCalendar = () =>
    downloadIcs(
      'mi-cita.ics',
      buildIcs({
        uid: a.id,
        title: `${a.serviceName} · ${business.name}`,
        start: a.startsAt,
        end: a.endsAt,
        location: [business.address, business.city].filter(Boolean).join(', ') || undefined,
        description: `Con ${a.professional.name}. Ver o cancelar: ${window.location.origin}/cita/${token}`,
      }),
    );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/cita/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el navegador no permitió copiar */
    }
  };

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await publicApi.cancel(token);
      router.replace(`/cita/${token}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cancelar. Intenta de nuevo');
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {active && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="primary" onClick={addToCalendar}>
            Agregar a mi calendario
          </Button>
          {whatsapp && (
            <a
              href={whatsappLink(
                whatsapp,
                `Hola, tengo una cita de ${a.serviceName} el ${when} a nombre de ${a.customer.name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('secondary')}
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
      )}

      {active && (
        <p className="text-stone text-sm">
          Guarda este enlace para ver o cancelar tu cita.{' '}
          <button
            type="button"
            onClick={copyLink}
            className="text-ink underline underline-offset-2"
          >
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </p>
      )}

      {error && (
        <p role="alert" className="border-line bg-paper-2 rounded-xl border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {a.canCancel &&
        (confirming ? (
          <div className="border-line rounded-2xl border p-4">
            <p>¿Seguro que quieres cancelar tu cita del {when}?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={cancel}
                disabled={busy}
                className="bg-[#A5473F] text-white hover:bg-[#A5473F]/90"
              >
                {busy ? 'Cancelando…' : 'Sí, cancelar'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                No, mantenerla
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-stone hover:text-ink text-sm underline underline-offset-2"
          >
            Cancelar mi cita
          </button>
        ))}

      {active && !a.canCancel && (
        <p className="text-stone text-sm">
          Ya no es posible cancelar en línea. Si necesitas cambiarla, escríbenos.
        </p>
      )}
    </div>
  );
}
