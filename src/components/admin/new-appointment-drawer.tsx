'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/toast';
import { formatDuration, formatMoney, prettyPhone } from '@/lib/format';
import {
  useCreateAppointment,
  useCustomerSearch,
  useProfessionals,
  useServices,
} from '@/lib/admin/queries';
import type { AdminBusiness, AdminCustomer } from '@/lib/admin/types';
import { localDate, zonedToUtc } from '@/lib/tz';
import { Field, Select, TextInput } from './form';
import { SlotPicker } from './slot-picker';

export interface NewAppointmentPrefill {
  date?: string;
  minute?: number;
  professionalId?: string;
  /** Desde la ficha del cliente */
  customer?: AdminCustomer;
}

/** "Nueva cita" en una sola pantalla: cliente → servicio → profesional → día y hora. */
export function NewAppointmentDrawer({
  open,
  onClose,
  business,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  business: AdminBusiness;
  prefill?: NewAppointmentPrefill;
}) {
  const tz = business.timezone;
  const services = useServices();
  const professionals = useProfessionals();
  const create = useCreateAppointment();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(localDate(new Date(), tz));
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [outsideHours, setOutsideHours] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const search = useCustomerSearch(query);

  // Reiniciar con los datos del hueco tocado en el calendario.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCustomer(prefill?.customer ?? null);
    setIsNew(false);
    setName('');
    setPhone('');
    setServiceId('');
    setNotes('');
    setError(null);
    setOutsideHours(false);
    setProfessionalId(prefill?.professionalId ?? '');
    const d = prefill?.date ?? localDate(new Date(), tz);
    setDate(d);
    setStartsAt(prefill?.minute != null ? zonedToUtc(d, prefill.minute, tz).toISOString() : null);
  }, [open, prefill, tz]);

  const eligible = useMemo(
    () =>
      (professionals.data ?? []).filter(
        (p) => !serviceId || p.services.some((s) => s.id === serviceId),
      ),
    [professionals.data, serviceId],
  );
  useEffect(() => {
    if (professionalId && !eligible.some((p) => p.id === professionalId)) setProfessionalId('');
    if (!professionalId && eligible.length === 1) setProfessionalId(eligible[0].id);
  }, [eligible, professionalId]);

  const service = services.data?.find((s) => s.id === serviceId);

  const submit = () => {
    setError(null);
    if (!customer && !(isNew && name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 7)) {
      return setError('Elige un cliente o escribe nombre y teléfono');
    }
    if (!serviceId || !professionalId) return setError('Elige servicio y profesional');
    if (!startsAt) return setError('Elige una hora');
    create.mutate(
      {
        serviceId,
        professionalId,
        startsAt,
        ...(customer
          ? { customerId: customer.id }
          : { customer: { name: name.trim(), phone: phone.trim() } }),
        internalNotes: notes.trim() || undefined,
        allowOutsideHours: outsideHours || undefined,
      },
      {
        onSuccess: () => {
          toast('Cita creada');
          onClose();
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nueva cita"
      footer={
        <div className="space-y-3">
          {error && (
            <p role="alert" className="text-sm text-[#A5473F]">
              {error}
            </p>
          )}
          <Button onClick={submit} disabled={create.isPending} className="w-full" size="lg">
            {create.isPending ? 'Guardando…' : 'Guardar cita'}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        <section aria-labelledby="na-customer" className="space-y-3">
          <h3 id="na-customer" className="eyebrow">
            Cliente
          </h3>
          {customer ? (
            <div className="border-ink/70 flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <p>{customer.name}</p>
                <p className="text-stone text-sm">
                  {prettyPhone(customer.phone)} · {customer.appointmentsCount} cita(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomer(null)}
                className="text-stone text-sm underline underline-offset-2"
              >
                Cambiar
              </button>
            </div>
          ) : isNew ? (
            <div className="grid gap-3">
              <Field label="Nombre" htmlFor="na-name">
                <TextInput
                  id="na-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label="Teléfono" htmlFor="na-phone">
                <TextInput
                  id="na-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="300 123 4567"
                />
              </Field>
              <button
                type="button"
                onClick={() => setIsNew(false)}
                className="text-stone justify-self-start text-sm underline underline-offset-2"
              >
                Buscar un cliente existente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Field label="Buscar por nombre o teléfono" htmlFor="na-search">
                <TextInput
                  id="na-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Juan, 300 123…"
                  autoComplete="off"
                />
              </Field>
              {query.trim().length >= 2 && (
                <ul className="divide-line border-line divide-y rounded-xl border">
                  {(search.data ?? []).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setCustomer(c)}
                        className="hover:bg-paper-2 flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span>{c.name}</span>
                        <span className="text-stone text-sm">{prettyPhone(c.phone)}</span>
                      </button>
                    </li>
                  ))}
                  {search.data && !search.data.length && (
                    <li className="text-stone px-4 py-3 text-sm">Sin resultados.</li>
                  )}
                </ul>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsNew(true);
                  if (/\d{3}/.test(query)) setPhone(query);
                  else setName(query);
                }}
                className="text-sm underline underline-offset-2"
              >
                + Cliente nuevo
              </button>
            </div>
          )}
        </section>

        <section aria-labelledby="na-service" className="grid gap-3">
          <h3 id="na-service" className="eyebrow">
            Servicio y profesional
          </h3>
          <Field
            label="Servicio"
            htmlFor="na-svc"
            hint={
              service
                ? `${formatDuration(service.durationMinutes)} · ${formatMoney(service.priceCents, business.currency)}`
                : undefined
            }
          >
            <Select
              id="na-svc"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setStartsAt(null);
              }}
            >
              <option value="">Elige un servicio</option>
              {(services.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Profesional" htmlFor="na-pro">
            <Select
              id="na-pro"
              value={professionalId}
              onChange={(e) => {
                setProfessionalId(e.target.value);
                setStartsAt(null);
              }}
            >
              <option value="">Elige quién atiende</option>
              {eligible.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </section>

        <section aria-labelledby="na-when" className="grid gap-3">
          <h3 id="na-when" className="eyebrow">
            Día y hora
          </h3>
          <Field label="Día" htmlFor="na-date">
            <TextInput
              id="na-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setStartsAt(null);
              }}
            />
          </Field>
          <SlotPicker
            idPrefix="na"
            serviceId={serviceId || undefined}
            professionalId={professionalId || undefined}
            date={date}
            timezone={tz}
            value={startsAt}
            onChange={setStartsAt}
            outsideHours={outsideHours}
            onOutsideHours={setOutsideHours}
          />
        </section>

        <Field label="Nota interna (opcional)" htmlFor="na-notes" hint="El cliente no la ve.">
          <TextInput
            id="na-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
          />
        </Field>
      </div>
    </Drawer>
  );
}
