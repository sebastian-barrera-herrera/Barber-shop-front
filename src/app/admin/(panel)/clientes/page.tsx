'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Field, TextInput } from '@/components/admin/form';
import {
  NewAppointmentDrawer,
  type NewAppointmentPrefill,
} from '@/components/admin/new-appointment-drawer';
import { EmptyState, PageHeader, PageShell } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { STATUS } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { formatMoney, prettyPhone, whatsappLink } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import {
  useCustomer,
  useCustomerHistory,
  useCustomers,
  useSaveCustomer,
  useStartConversation,
} from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';
import type { AdminCustomer } from '@/lib/admin/types';

function ClientesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { canManage } = useAuth();
  const business = useBusiness();
  const tz = business.data?.timezone ?? 'America/Bogota';
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [booking, setBooking] = useState<NewAppointmentPrefill | null>(null);
  const openId = params.get('id');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const list = useCustomers(debounced.length >= 2 ? debounced : '', page);
  const setOpen = (id: string | null) =>
    router.replace(id ? `/admin/clientes?id=${id}` : '/admin/clientes', { scroll: false });
  const day = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat('es-CO', {
          timeZone: tz,
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(iso))
      : '—';
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  return (
    <PageShell>
      <PageHeader
        title="Clientes"
        description="Todos los que han reservado. Se crean solos al reservar, identificados por su teléfono."
        action={
          canManage ? (
            <Button size="lg" onClick={() => setAdding(true)}>
              + Agregar cliente
            </Button>
          ) : undefined
        }
      />

      <div className="max-w-md">
        <label htmlFor="c-q" className="sr-only">
          Buscar cliente
        </label>
        <TextInput
          id="c-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, teléfono o correo"
        />
      </div>

      <div className="mt-6">
        {list.data && !list.data.items.length ? (
          <EmptyState
            title={debounced ? 'Sin coincidencias' : 'Todavía no hay clientes'}
            body={
              debounced
                ? 'Revisa cómo está escrito o busca por teléfono.'
                : 'Aparecerán aquí cuando alguien reserve.'
            }
          />
        ) : (
          <ul className="divide-line border-line divide-y rounded-2xl border">
            {(list.data?.items ?? []).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpen(c.id)}
                  className="hover:bg-paper-2 grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-3.5 text-left md:grid-cols-[1.5fr_1fr_6rem_8rem]"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className="text-stone block text-sm md:hidden">
                      {prettyPhone(c.phone)}
                    </span>
                  </span>
                  <span className="text-stone hidden md:block">{prettyPhone(c.phone)}</span>
                  <span className="tabular text-right text-sm md:text-left">
                    {c.appointmentsCount}{' '}
                    <span className="text-stone">cita{c.appointmentsCount === 1 ? '' : 's'}</span>
                  </span>
                  <span className="text-stone hidden text-sm md:block">
                    {day(c.lastAppointmentAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between text-sm">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Anteriores
          </Button>
          <span className="text-stone">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguientes →
          </Button>
        </nav>
      )}

      <CustomerDrawer
        id={openId}
        timezone={tz}
        currency={business.data?.currency ?? 'COP'}
        onClose={() => setOpen(null)}
        onBook={(customer) => setBooking({ customer })}
      />
      <AddCustomerDrawer
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(id) => setOpen(id)}
      />
      {business.data && (
        <NewAppointmentDrawer
          open={!!booking}
          onClose={() => setBooking(null)}
          business={business.data}
          prefill={booking ?? undefined}
        />
      )}
    </PageShell>
  );
}

function CustomerDrawer({
  id,
  timezone,
  currency,
  onClose,
  onBook,
}: {
  id: string | null;
  timezone: string;
  currency: string;
  onClose: () => void;
  onBook: (customer: AdminCustomer) => void;
}) {
  const { canManage } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const detail = useCustomer(id);
  const history = useCustomerHistory(id);
  const save = useSaveCustomer();
  const start = useStartConversation();
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const c = detail.data;

  useEffect(() => {
    if (!c) return;
    setNotes(c.notes ?? '');
    setForm({ name: c.name, phone: c.phone, email: c.email ?? '' });
    setEditing(false);
    setMessage('');
  }, [c]);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <Drawer open={!!id} onClose={onClose} title={c?.name ?? 'Cliente'}>
      {!c ? (
        <p className="text-stone">Cargando…</p>
      ) : (
        <div className="space-y-7">
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={`tel:${c.phone}`} className="underline underline-offset-2">
              {prettyPhone(c.phone)}
            </a>
            <a
              href={whatsappLink(c.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              WhatsApp
            </a>
            {c.email && (
              <a href={`mailto:${c.email}`} className="underline underline-offset-2">
                {c.email}
              </a>
            )}
          </div>

          <dl className="border-line bg-line grid grid-cols-3 gap-px overflow-hidden rounded-2xl border text-center">
            {[
              [String(c.stats.completed), 'visitas'],
              [formatMoney(c.stats.totalSpentCents, currency), 'gastado'],
              [String(c.stats.cancelled + c.stats.noShow), 'cancel. / no vino'],
            ].map(([v, l]) => (
              <div key={l} className="bg-paper flex flex-col-reverse px-2 py-3">
                <dt className="text-stone text-xs">{l}</dt>
                <dd className="tabular font-display text-xl">{v}</dd>
              </div>
            ))}
          </dl>

          {c.nextAppointment && (
            <p className="bg-paper-2 rounded-xl px-4 py-3 text-sm">
              Próxima cita: <span className="capitalize">{fmt(c.nextAppointment.startsAt)}</span> ·{' '}
              {c.nextAppointment.serviceNameSnapshot} con {c.nextAppointment.professional.name}
            </p>
          )}

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  onBook({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    email: c.email,
                    appointmentsCount: c.stats.appointments,
                    lastAppointmentAt: c.stats.lastAppointmentAt,
                  })
                }
              >
                Agendar cita
              </Button>
              <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Cancelar edición' : 'Editar datos'}
              </Button>
            </div>
          )}

          {editing && (
            <div className="border-line space-y-3 rounded-2xl border p-4">
              <Field label="Nombre" htmlFor="ce-name">
                <TextInput
                  id="ce-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Teléfono" htmlFor="ce-phone">
                <TextInput
                  id="ce-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Correo" htmlFor="ce-email">
                <TextInput
                  id="ce-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Button
                disabled={save.isPending}
                onClick={() =>
                  save.mutate(
                    { id: c.id, name: form.name, phone: form.phone, email: form.email || null },
                    {
                      onSuccess: () => {
                        toast('Datos guardados');
                        setEditing(false);
                      },
                      onError: (e) => toast(e.message, 'error'),
                    },
                  )
                }
              >
                Guardar
              </Button>
            </div>
          )}

          {canManage && (
            <Field
              label="Notas"
              htmlFor="c-notes"
              hint="Preferencias, alergias… Solo las ve el equipo."
            >
              <textarea
                id="c-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-line bg-paper hover:border-stone focus:border-ink w-full rounded-xl border px-3.5 py-2.5 focus:outline-none"
              />
              {notes !== (c.notes ?? '') && (
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() =>
                    save.mutate(
                      { id: c.id, notes: notes.trim() || null },
                      { onSuccess: () => toast('Nota guardada') },
                    )
                  }
                >
                  Guardar nota
                </Button>
              )}
            </Field>
          )}

          {canManage && (
            <Field
              label="Escribirle un mensaje"
              htmlFor="c-msg"
              hint="Lo verá en el enlace de su cita."
            >
              <div className="flex gap-2">
                <TextInput
                  id="c-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                />
                <Button
                  disabled={!message.trim() || start.isPending}
                  onClick={() =>
                    start.mutate(
                      { customerId: c.id, body: message.trim() },
                      {
                        onSuccess: (r) => router.push(`/admin/mensajes?c=${r.conversationId}`),
                        onError: (e) => toast(e.message, 'error'),
                      },
                    )
                  }
                >
                  Enviar
                </Button>
              </div>
            </Field>
          )}

          <section>
            <h3 className="eyebrow mb-2">Historial</h3>
            {!history.data?.items.length ? (
              <p className="text-stone text-sm">Sin citas todavía.</p>
            ) : (
              <ul className="divide-line border-line divide-y border-y">
                {history.data.items.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block capitalize">{fmt(a.startsAt)}</span>
                      <span className="text-stone block truncate">
                        {a.serviceNameSnapshot} · {a.professional.name}
                      </span>
                    </span>
                    <span className="text-stone flex shrink-0 items-center gap-1.5">
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${STATUS[a.status].dot}`}
                      />
                      {STATUS[a.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function AddCustomerDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const save = useSaveCustomer();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ name: '', phone: '', email: '', notes: '' });
      setError(null);
    }
  }, [open]);

  const submit = () =>
    save.mutate(
      {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
      },
      {
        onSuccess: (c) => {
          toast('Cliente agregado');
          onClose();
          onCreated(c.id);
        },
        onError: (e) => setError(e.message),
      },
    );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Agregar cliente"
      footer={
        <div className="space-y-2">
          {error && (
            <p role="alert" className="text-sm text-[#A5473F]">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            size="lg"
            disabled={
              save.isPending ||
              form.name.trim().length < 2 ||
              form.phone.replace(/\D/g, '').length < 7
            }
            onClick={submit}
          >
            Guardar cliente
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" htmlFor="ac-name">
          <TextInput
            id="ac-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Teléfono" htmlFor="ac-phone">
          <TextInput
            id="ac-phone"
            type="tel"
            inputMode="tel"
            placeholder="300 123 4567"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Correo (opcional)" htmlFor="ac-email">
          <TextInput
            id="ac-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Notas (opcional)" htmlFor="ac-notes">
          <TextInput
            id="ac-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
      </div>
    </Drawer>
  );
}

export default function ClientesPage() {
  return (
    <Suspense>
      <ClientesInner />
    </Suspense>
  );
}
