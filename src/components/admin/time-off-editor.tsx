'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useDeleteTimeOff, useSaveTimeOff, useTimeOff } from '@/lib/admin/hooks';
import { localDate, toMinutes, zonedToUtc } from '@/lib/tz';
import { Field, TextInput } from './form';
import { Switch } from './switch';

/** Días libres y bloqueos de un profesional (vacaciones, citas médicas…). */
export function TimeOffEditor({
  professionalId,
  timezone,
}: {
  professionalId: string;
  timezone: string;
}) {
  const list = useTimeOff(professionalId);
  const save = useSaveTimeOff();
  const remove = useDeleteTimeOff();
  const toast = useToast();
  const today = localDate(new Date(), timezone);
  const [allDay, setAllDay] = useState(true);
  const [form, setForm] = useState({
    from: today,
    to: today,
    start: '09:00',
    end: '12:00',
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mine = (list.data ?? []).filter((t) => t.professionalId === professionalId);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));

  const submit = () => {
    setError(null);
    const startsAt = zonedToUtc(form.from, allDay ? 0 : toMinutes(form.start), timezone);
    const endsAt = allDay
      ? zonedToUtc(form.to, 24 * 60, timezone)
      : zonedToUtc(form.from, toMinutes(form.end), timezone);
    if (endsAt <= startsAt) return setError('El final debe ser después del inicio');
    save.mutate(
      {
        professionalId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        reason: form.reason.trim() || undefined,
      },
      {
        onSuccess: (r) => {
          toast(
            r.conflictingAppointments
              ? `Bloqueo guardado. Ojo: hay ${r.conflictingAppointments} cita(s) en ese horario; revísalas.`
              : 'Bloqueo guardado',
            r.conflictingAppointments ? 'error' : 'neutral',
          );
          setForm({ ...form, reason: '' });
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-line space-y-3 rounded-2xl border p-4">
        <Switch checked={allDay} onChange={setAllDay} label="Días completos" showLabel />
        <div className="grid grid-cols-2 gap-3">
          <Field label={allDay ? 'Desde' : 'Día'} htmlFor="to-from">
            <TextInput
              id="to-from"
              type="date"
              value={form.from}
              min={today}
              onChange={(e) =>
                setForm({
                  ...form,
                  from: e.target.value,
                  to: e.target.value > form.to ? e.target.value : form.to,
                })
              }
            />
          </Field>
          {allDay ? (
            <Field label="Hasta" htmlFor="to-to">
              <TextInput
                id="to-to"
                type="date"
                value={form.to}
                min={form.from}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Field label="De" htmlFor="to-s">
                <TextInput
                  id="to-s"
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </Field>
              <Field label="A" htmlFor="to-e">
                <TextInput
                  id="to-e"
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </Field>
            </div>
          )}
        </div>
        <Field label="Motivo (opcional)" htmlFor="to-r">
          <TextInput
            id="to-r"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Vacaciones, cita médica…"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-[#A5473F]">
            {error}
          </p>
        )}
        <Button onClick={submit} disabled={save.isPending}>
          Bloquear
        </Button>
      </div>

      <div>
        <h3 className="eyebrow mb-2">Próximos bloqueos</h3>
        {!mine.length ? (
          <p className="text-stone text-sm">
            No hay bloqueos. Las horas bloqueadas no se ofrecen para reservar.
          </p>
        ) : (
          <ul className="divide-line border-line divide-y border-y">
            {mine.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="block capitalize">
                    {fmt(t.startsAt)} → {fmt(t.endsAt)}
                  </span>
                  {t.reason && <span className="text-stone">{t.reason}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(t.id, { onSuccess: () => toast('Bloqueo quitado') })}
                  className="text-stone underline underline-offset-2"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
