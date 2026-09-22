'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import {
  formatDuration,
  formatLongDate,
  formatMoney,
  formatTime,
  prettyPhone,
  whatsappLink,
} from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import { useProfessionals, useUpdateAppointment } from '@/lib/admin/queries';
import type { AdminAppointment, AdminBusiness, PaymentMethod } from '@/lib/admin/types';
import { localDate } from '@/lib/tz';
import { Field, Select, TextInput } from './form';
import { SlotPicker } from './slot-picker';
import { StatusActions } from './status-actions';

const PAYMENT: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  ONLINE: 'En línea',
  OTHER: 'Otro',
};

/** Detalle de una cita con acciones: estado, mover, pago y notas. */
export function AppointmentDrawer({
  appointment: a,
  business,
  onClose,
}: {
  appointment: AdminAppointment | null;
  business: AdminBusiness;
  onClose: () => void;
}) {
  const { canManage } = useAuth();
  const tz = business.timezone;
  const professionals = useProfessionals();
  const update = useUpdateAppointment();
  const toast = useToast();
  const [moving, setMoving] = useState(false);
  const [date, setDate] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [outsideHours, setOutsideHours] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!a) return;
    setMoving(false);
    setDate(localDate(a.startsAt, tz));
    setProfessionalId(a.professional.id);
    setStartsAt(null);
    setOutsideHours(false);
    setNotes(a.internalNotes ?? '');
  }, [a, tz]);

  if (!a)
    return (
      <Drawer open={false} onClose={onClose} title="">
        {null}
      </Drawer>
    );

  const active = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status);
  const eligible = (professionals.data ?? []).filter((p) =>
    p.services.some((s) => s.id === a.service.id),
  );

  const save = (body: Record<string, unknown>, done: string, after?: () => void) =>
    update.mutate(
      { id: a.id, ...body },
      {
        onSuccess: () => {
          toast(done);
          after?.();
        },
        onError: (e) => toast(e.message, 'error'),
      },
    );

  return (
    <Drawer open={!!a} onClose={onClose} title={a.customer.name}>
      <div className="space-y-7">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={a.status} />
          <span className="text-stone text-sm">
            {a.source === 'WEB' ? 'Reservó en la web' : 'Creada en el panel'}
          </span>
        </div>

        <dl className="divide-line border-line divide-y border-y">
          {[
            ['Servicio', `${a.serviceNameSnapshot} · ${formatDuration(a.durationMinutes)}`],
            ['Cuándo', `${formatLongDate(a.startsAt, tz)} · ${formatTime(a.startsAt, tz)}`],
            ['Con', a.professional.name],
            ['Precio', formatMoney(a.priceCents, business.currency)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3">
              <dt className="text-stone">{k}</dt>
              <dd className="text-right first-letter:uppercase">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-stone">Contacto</dt>
            <dd className="flex gap-3">
              <a href={`tel:${a.customer.phone}`} className="underline underline-offset-2">
                {prettyPhone(a.customer.phone)}
              </a>
              <a
                href={whatsappLink(a.customer.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                WhatsApp
              </a>
            </dd>
          </div>
        </dl>

        {a.notes && (
          <div>
            <p className="eyebrow mb-1.5">Nota del cliente</p>
            <p className="bg-paper-2 rounded-xl px-4 py-3">{a.notes}</p>
          </div>
        )}
        {a.status === 'CANCELLED' && a.cancelReason && (
          <p className="text-stone text-sm">Motivo: {a.cancelReason}</p>
        )}

        <StatusActions appointment={a} size="md" />

        {canManage && active && (
          <section className="space-y-3">
            {!moving ? (
              <Button variant="secondary" onClick={() => setMoving(true)}>
                Mover cita
              </Button>
            ) : (
              <div className="border-line space-y-3 rounded-2xl border p-4">
                <p className="eyebrow">Mover a</p>
                <Field label="Día" htmlFor="mv-date">
                  <TextInput
                    id="mv-date"
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setStartsAt(null);
                    }}
                  />
                </Field>
                <Field label="Profesional" htmlFor="mv-pro">
                  <Select
                    id="mv-pro"
                    value={professionalId}
                    onChange={(e) => {
                      setProfessionalId(e.target.value);
                      setStartsAt(null);
                    }}
                  >
                    {eligible.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <SlotPicker
                  idPrefix="mv"
                  serviceId={a.service.id}
                  professionalId={professionalId}
                  date={date}
                  timezone={tz}
                  value={startsAt}
                  onChange={setStartsAt}
                  outsideHours={outsideHours}
                  onOutsideHours={setOutsideHours}
                />
                <div className="flex gap-2">
                  <Button
                    disabled={!startsAt || update.isPending}
                    onClick={() =>
                      save(
                        { startsAt, professionalId, allowOutsideHours: outsideHours || undefined },
                        'Cita movida',
                        () => setMoving(false),
                      )
                    }
                  >
                    Guardar cambio
                  </Button>
                  <Button variant="ghost" onClick={() => setMoving(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {canManage && (a.status === 'COMPLETED' || a.status === 'IN_PROGRESS') && (
          <section className="space-y-2">
            <p className="eyebrow">Pago en el local</p>
            {a.paymentStatus === 'PAID' ? (
              <p className="text-sm">
                Pagado{a.paymentMethod ? ` · ${PAYMENT[a.paymentMethod]}` : ''}.{' '}
                <button
                  type="button"
                  className="text-stone underline underline-offset-2"
                  onClick={() =>
                    save({ paymentStatus: 'UNPAID', paymentMethod: null }, 'Pago desmarcado')
                  }
                >
                  Deshacer
                </button>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(['CASH', 'CARD', 'TRANSFER'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      save({ paymentStatus: 'PAID', paymentMethod: m }, 'Pago registrado')
                    }
                    className="border-line hover:border-ink h-9 rounded-full border px-3.5 text-sm"
                  >
                    {PAYMENT[m]}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {canManage && (
          <Field label="Nota interna" htmlFor="ad-notes" hint="Solo la ve el equipo.">
            <div className="flex gap-2">
              <TextInput
                id="ad-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
              {notes !== (a.internalNotes ?? '') && (
                <Button
                  variant="secondary"
                  onClick={() => save({ internalNotes: notes.trim() || null }, 'Nota guardada')}
                >
                  Guardar
                </Button>
              )}
            </div>
          </Field>
        )}
      </div>
    </Drawer>
  );
}
