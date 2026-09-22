'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { useChangeStatus } from '@/lib/admin/queries';
import type { AdminAppointment } from '@/lib/admin/types';
import type { AppointmentStatus } from '@/lib/types';

const ACTIONS: Partial<
  Record<
    AppointmentStatus,
    { to: AppointmentStatus; label: string; done: string; primary?: boolean }[]
  >
> = {
  PENDING: [
    { to: 'CONFIRMED', label: 'Confirmar', done: 'Cita confirmada', primary: true },
    { to: 'IN_PROGRESS', label: 'Empezar', done: 'Cita en curso' },
  ],
  CONFIRMED: [
    { to: 'IN_PROGRESS', label: 'Empezar', done: 'Cita en curso', primary: true },
    { to: 'NO_SHOW', label: 'No vino', done: 'Marcada como "no asistió"' },
  ],
  IN_PROGRESS: [{ to: 'COMPLETED', label: 'Completar', done: 'Cita completada', primary: true }],
};

/** Botones de un toque para mover la cita al siguiente estado. Cancelar pide confirmación. */
export function StatusActions({
  appointment,
  size = 'sm',
}: {
  appointment: AdminAppointment;
  size?: 'sm' | 'md';
}) {
  const change = useChangeStatus();
  const toast = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const actions = ACTIONS[appointment.status] ?? [];
  const canCancel = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(appointment.status);
  if (!actions.length && !canCancel) return null;

  const run = (to: AppointmentStatus, done: string) =>
    change.mutate(
      { id: appointment.id, status: to },
      {
        onSuccess: () => toast(done),
        onError: (e) => toast(e.message, 'error'),
      },
    );

  const h = size === 'sm' ? 'h-9 px-3.5 text-sm' : 'h-11 px-5';
  const base = `inline-flex items-center rounded-full transition-colors disabled:opacity-50 ${h}`;

  if (confirmCancel) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">¿Cancelar esta cita?</span>
        <button
          type="button"
          disabled={change.isPending}
          onClick={() => {
            run('CANCELLED', 'Cita cancelada');
            setConfirmCancel(false);
          }}
          className={`${base} bg-[#A5473F] text-white hover:bg-[#A5473F]/90`}
        >
          Sí, cancelar
        </button>
        <button
          type="button"
          onClick={() => setConfirmCancel(false)}
          className={`${base} hover:bg-paper-2`}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.to}
          type="button"
          disabled={change.isPending}
          onClick={() => run(a.to, a.done)}
          className={`${base} ${a.primary ? 'bg-brand text-on-brand hover:bg-brand/88' : 'border-line hover:border-ink border'}`}
        >
          {a.label}
        </button>
      ))}
      {canCancel && (
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className={`${base} text-stone hover:text-ink`}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
