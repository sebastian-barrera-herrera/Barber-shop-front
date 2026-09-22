'use client';

import { useEffect, useState } from 'react';
import { Field, Select, TextInput } from '@/components/admin/form';
import { EmptyState, NoAccess, PageHeader, PageShell } from '@/components/admin/page-header';
import { Switch } from '@/components/admin/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import { useMarkRefunded, usePayments, useSaveWompi, useWompiConfig } from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';

const STATE = {
  PENDING: { label: 'En proceso', dot: 'bg-[#C8912E]' },
  PAID: { label: 'Aprobado', dot: 'bg-[#3F8F5B]' },
  FAILED: { label: 'Rechazado', dot: 'bg-[#A5473F]' },
  REFUNDED: { label: 'Reembolsado', dot: 'bg-stone/60' },
} as const;

export default function PagosPage() {
  const { canManage, user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const business = useBusiness();
  const [status, setStatus] = useState('');
  const payments = usePayments(status || undefined);
  const refund = useMarkRefunded();
  const toast = useToast();
  const tz = business.data?.timezone ?? 'America/Bogota';

  if (!canManage) return <NoAccess who="el dueño o el administrador" />;

  const when = (iso: string) =>
    new Intl.DateTimeFormat('es-CO', {
      timeZone: tz,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <PageShell>
      <PageHeader
        title="Pagos"
        description="Pagos en línea de tus clientes. Los pagos en el local se registran desde cada cita."
      />

      {isOwner && <WompiCard />}

      <section aria-labelledby="pay-list" className="mt-12">
        <div className="border-ink/80 mb-3 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <h2 id="pay-list" className="font-display text-2xl">
            Movimientos
          </h2>
          <div className="w-48">
            <label htmlFor="pay-st" className="sr-only">
              Estado
            </label>
            <Select
              id="pay-st"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10"
            >
              <option value="">Todos</option>
              {Object.entries(STATE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {payments.data && !payments.data.items.length ? (
          <EmptyState
            title="Sin pagos en línea todavía"
            body="Cuando un cliente pague su cita desde la web, lo verás aquí con su estado."
          />
        ) : (
          <ul className="divide-line divide-y">
            {(payments.data?.items ?? []).map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 md:grid-cols-[8rem_1.4fr_1fr_7rem_8rem]"
              >
                <span className="text-stone hidden text-sm md:block">{when(p.createdAt)}</span>
                <span className="min-w-0">
                  <span className="block truncate">{p.appointment.customer.name}</span>
                  <span className="text-stone block truncate text-sm">
                    {p.appointment.serviceNameSnapshot}
                    <span className="md:hidden"> · {when(p.createdAt)}</span>
                  </span>
                </span>
                <span
                  className="text-stone hidden truncate font-mono text-xs md:block"
                  title={p.providerReference}
                >
                  {p.providerReference}
                </span>
                <span className="tabular text-right">{formatMoney(p.amountCents, p.currency)}</span>
                <span className="col-span-2 flex items-center justify-between gap-2 text-sm md:col-span-1 md:justify-end">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className={`size-2 rounded-full ${STATE[p.status].dot}`} />
                    {STATE[p.status].label}
                  </span>
                  {isOwner && p.status === 'PAID' && (
                    <button
                      type="button"
                      className="text-stone text-xs underline underline-offset-2"
                      onClick={() => {
                        if (
                          window.confirm(
                            '¿Ya hiciste el reembolso en el panel de Wompi? Esto solo lo registra aquí.',
                          )
                        ) {
                          refund.mutate(p.id, { onSuccess: () => toast('Reembolso registrado') });
                        }
                      }}
                    >
                      Registrar reembolso
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

function WompiCard() {
  const config = useWompiConfig(true);
  const save = useSaveWompi();
  const toast = useToast();
  const [form, setForm] = useState({
    environment: 'SANDBOX' as 'SANDBOX' | 'PRODUCTION',
    publicKey: '',
    privateKey: '',
    integritySecret: '',
    eventsSecret: '',
    isEnabled: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const c = config.data;

  useEffect(() => {
    if (c)
      setForm((f) => ({
        ...f,
        environment: c.environment,
        publicKey: c.publicKey,
        isEnabled: c.isEnabled,
        privateKey: '',
        integritySecret: '',
        eventsSecret: '',
      }));
  }, [c]);

  const secret = (
    key: 'privateKey' | 'integritySecret' | 'eventsSecret',
    label: string,
    hint: string,
  ) => (
    <Field
      label={label}
      htmlFor={`w-${key}`}
      hint={c?.configuredSecrets[key] ? 'Guardado. Déjalo vacío para conservarlo.' : hint}
    >
      <TextInput
        id={`w-${key}`}
        type="password"
        autoComplete="off"
        value={form[key]}
        placeholder={c?.configuredSecrets[key] ? '••••••••••••' : ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </Field>
  );

  return (
    <section aria-labelledby="wompi-title" className="border-line rounded-[22px] border p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="wompi-title" className="font-display text-2xl">
            Cobrar en línea con Wompi
          </h2>
          <p className="text-stone mt-1 max-w-xl text-sm">
            Tus clientes pagan con tarjeta, PSE o Nequi al reservar. Los secretos se guardan
            cifrados y nunca se muestran de nuevo.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm ${c?.isEnabled ? 'bg-[#3F8F5B]/12 text-[#2F6E46]' : 'bg-paper-2 text-stone'}`}
        >
          {c?.isEnabled
            ? `Activo · ${c.environment === 'SANDBOX' ? 'pruebas' : 'producción'}`
            : c?.usingEnvFallback
              ? 'Usando llaves del servidor'
              : 'Sin conectar'}
        </span>
      </div>

      <ol className="text-stone mt-6 grid gap-2 text-sm md:grid-cols-3">
        <li>
          <span className="tabular text-ink">1.</span> En tu cuenta de Wompi, ve a{' '}
          <em>Desarrolladores</em> y copia las llaves.
        </li>
        <li>
          <span className="tabular text-ink">2.</span> Pega abajo la URL de eventos en Wompi →{' '}
          <em>URL de eventos</em>.
        </li>
        <li>
          <span className="tabular text-ink">3.</span> Prueba en ambiente de pruebas y luego cambia
          a producción.
        </li>
      </ol>

      <div className="bg-paper-2 mt-5 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-sm">
        <span className="text-stone">URL de eventos:</span>
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{c?.webhookUrl}</code>
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={async () => {
            await navigator.clipboard.writeText(c?.webhookUrl ?? '').catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Ambiente" htmlFor="w-env">
          <Select
            id="w-env"
            value={form.environment}
            onChange={(e) =>
              setForm({ ...form, environment: e.target.value as 'SANDBOX' | 'PRODUCTION' })
            }
          >
            <option value="SANDBOX">Pruebas (sandbox)</option>
            <option value="PRODUCTION">Producción (cobros reales)</option>
          </Select>
        </Field>
        <Field
          label="Llave pública"
          htmlFor="w-pub"
          hint={form.environment === 'SANDBOX' ? 'Empieza por pub_test_' : 'Empieza por pub_prod_'}
        >
          <TextInput
            id="w-pub"
            autoComplete="off"
            value={form.publicKey}
            onChange={(e) => setForm({ ...form, publicKey: e.target.value })}
          />
        </Field>
        {secret('privateKey', 'Llave privada', 'Empieza por prv_…')}
        {secret(
          'integritySecret',
          'Secreto de integridad',
          'En Desarrolladores → Secretos para integración técnica',
        )}
        {secret('eventsSecret', 'Secreto de eventos', 'Para verificar los avisos de pago')}
      </div>

      <div className="border-line mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
        <Switch
          checked={form.isEnabled}
          onChange={(isEnabled) => setForm({ ...form, isEnabled })}
          label="Aceptar pagos en línea"
          showLabel
        />
        <Button
          disabled={save.isPending}
          onClick={() => {
            setError(null);
            save.mutate(
              {
                ...form,
                privateKey: form.privateKey || undefined,
                integritySecret: form.integritySecret || undefined,
                eventsSecret: form.eventsSecret || undefined,
              },
              {
                onSuccess: () => toast('Configuración de pagos guardada'),
                onError: (e) => setError(e.message),
              },
            );
          }}
        >
          Guardar
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#A5473F]">
          {error}
        </p>
      )}
      <p className="text-stone mt-3 text-xs">
        Cuándo cobrar (nunca, opcional u obligatorio al reservar) se elige en Configuración →
        Reservas.
      </p>
    </section>
  );
}
