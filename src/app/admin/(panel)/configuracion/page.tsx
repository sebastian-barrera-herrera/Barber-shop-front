'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Field, Select, TextInput } from '@/components/admin/form';
import { ImageUpload } from '@/components/admin/image-upload';
import { NoAccess, PageHeader, PageShell } from '@/components/admin/page-header';
import { Switch } from '@/components/admin/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/admin/auth';
import {
  useBusinessInfo,
  useSaveBusiness,
  useSaveSettings,
  useSettings,
  type BusinessInfo,
  type Settings,
} from '@/lib/admin/hooks';
import { PRESETS, contrastRatio, presetsFor } from '@/lib/theme';
import type { BrandPreset, OpeningDay } from '@/lib/types';

type Section = 'negocio' | 'horario' | 'redes' | 'apariencia' | 'reservas';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'negocio', label: 'Negocio' },
  { key: 'horario', label: 'Horario' },
  { key: 'redes', label: 'Redes' },
  { key: 'apariencia', label: 'Apariencia' },
  { key: 'reservas', label: 'Reservas' },
];

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('negocio');
  const settings = useSettings();
  const info = useBusinessInfo();
  if (user?.role !== 'OWNER') return <NoAccess />;

  return (
    <PageShell>
      <PageHeader
        title="Configuración"
        description="Los cambios se ven en tu web en menos de un minuto."
      />
      <div
        role="tablist"
        aria-label="Secciones"
        className="-mx-1 mb-8 flex gap-1 overflow-x-auto pb-1"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={section === s.key}
            onClick={() => setSection(s.key)}
            className="text-stone aria-selected:bg-ink aria-selected:text-paper h-10 shrink-0 rounded-full px-4"
          >
            {s.label}
          </button>
        ))}
      </div>
      {!settings.data || !info.data ? (
        <div className="bg-paper-2 h-64 animate-pulse rounded-2xl" />
      ) : (
        <div className="max-w-3xl">
          {section === 'negocio' && <BusinessSection info={info.data} />}
          {section === 'horario' && <HoursSection value={settings.data.openingHours} />}
          {section === 'redes' && <SocialSection value={settings.data.social} />}
          {section === 'apariencia' && (
            <BrandingSection value={settings.data.branding} info={info.data} />
          )}
          {section === 'reservas' && <BookingSection value={settings.data.booking} />}
        </div>
      )}
    </PageShell>
  );
}

function SaveBar({ onSave, busy, dirty }: { onSave: () => void; busy: boolean; dirty: boolean }) {
  return (
    <div className="border-line bg-paper/95 sticky bottom-20 z-10 mt-8 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 backdrop-blur-sm md:bottom-4">
      <span className="text-stone text-sm">
        {dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}
      </span>
      <Button onClick={onSave} disabled={busy || !dirty}>
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </div>
  );
}

function Group({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-2xl">{title}</h2>
      {hint && <p className="text-stone mt-1 text-sm">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

// ───────────── Negocio ─────────────

const TYPES: { value: BusinessInfo['type']; label: string }[] = [
  { value: 'BARBERSHOP', label: 'Barbería' },
  { value: 'SALON', label: 'Peluquería / salón' },
  { value: 'SPA', label: 'Spa' },
  { value: 'NAILS', label: 'Uñas' },
  { value: 'AESTHETICS', label: 'Estética' },
  { value: 'OTHER', label: 'Varios servicios' },
];
const ZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Guayaquil',
  'America/Caracas',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
];

function BusinessSection({ info }: { info: BusinessInfo }) {
  const save = useSaveBusiness();
  const toast = useToast();
  const initial = () => ({
    name: info.name,
    type: info.type,
    description: info.description ?? '',
    phone: info.phone ?? '',
    whatsapp: info.whatsapp ?? '',
    email: info.email ?? '',
    address: info.address ?? '',
    city: info.city ?? '',
    timezone: info.timezone,
    latitude: info.latitude?.toString() ?? '',
    longitude: info.longitude?.toString() ?? '',
  });
  const [f, setF] = useState(initial);
  useEffect(() => setF(initial()), [info]);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial());
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')));
    save.mutate(
      {
        name: f.name,
        type: f.type,
        description: f.description || undefined,
        phone: f.phone || undefined,
        whatsapp: f.whatsapp || undefined,
        email: f.email || undefined,
        address: f.address || undefined,
        city: f.city || undefined,
        timezone: f.timezone,
        latitude: num(f.latitude),
        longitude: num(f.longitude),
      },
      {
        onSuccess: () => toast('Datos del negocio guardados'),
        onError: (e) => toast(e.message, 'error'),
      },
    );
  };

  return (
    <>
      <Group title="Datos del negocio">
        <Field label="Nombre" htmlFor="b-name">
          <TextInput id="b-name" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Tipo de negocio" htmlFor="b-type">
          <Select id="b-type" value={f.type} onChange={set('type')}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Descripción"
            htmlFor="b-desc"
            hint="Aparece en Google y al compartir el enlace."
          >
            <textarea
              id="b-desc"
              rows={2}
              maxLength={600}
              value={f.description}
              onChange={set('description')}
              className="border-line bg-paper hover:border-stone focus:border-ink w-full rounded-xl border px-3.5 py-2.5 focus:outline-none"
            />
          </Field>
        </div>
      </Group>
      <Group title="Contacto">
        <Field label="Teléfono" htmlFor="b-phone">
          <TextInput
            id="b-phone"
            type="tel"
            value={f.phone}
            onChange={set('phone')}
            placeholder="+57 300 123 4567"
          />
        </Field>
        <Field label="WhatsApp" htmlFor="b-wa" hint="Activa el botón de WhatsApp en la web.">
          <TextInput
            id="b-wa"
            type="tel"
            value={f.whatsapp}
            onChange={set('whatsapp')}
            placeholder="+57 300 123 4567"
          />
        </Field>
        <Field label="Correo" htmlFor="b-email">
          <TextInput id="b-email" type="email" value={f.email} onChange={set('email')} />
        </Field>
      </Group>
      <Group
        title="Ubicación"
        hint="La latitud y longitud son opcionales: mejoran el botón “Cómo llegar”."
      >
        <Field label="Dirección" htmlFor="b-addr">
          <TextInput id="b-addr" value={f.address} onChange={set('address')} />
        </Field>
        <Field label="Ciudad" htmlFor="b-city">
          <TextInput id="b-city" value={f.city} onChange={set('city')} />
        </Field>
        <Field label="Latitud" htmlFor="b-lat">
          <TextInput
            id="b-lat"
            inputMode="decimal"
            value={f.latitude}
            onChange={set('latitude')}
            placeholder="4.6697"
          />
        </Field>
        <Field label="Longitud" htmlFor="b-lng">
          <TextInput
            id="b-lng"
            inputMode="decimal"
            value={f.longitude}
            onChange={set('longitude')}
            placeholder="-74.0521"
          />
        </Field>
        <Field label="Zona horaria" htmlFor="b-tz">
          <Select id="b-tz" value={f.timezone} onChange={set('timezone')}>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </Field>
      </Group>
      <SaveBar onSave={submit} busy={save.isPending} dirty={dirty} />
    </>
  );
}

// ───────────── Horario ─────────────

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function HoursSection({ value }: { value: OpeningDay[] }) {
  const save = useSaveSettings();
  const toast = useToast();
  const [days, setDays] = useState(value);
  useEffect(() => setDays(value), [value]);
  const dirty = JSON.stringify(days) !== JSON.stringify(value);
  const update = (w: number, patch: Partial<OpeningDay>) =>
    setDays(days.map((d) => (d.weekday === w ? { ...d, ...patch } : d)));

  return (
    <>
      <h2 className="font-display text-2xl">Horario de atención</h2>
      <p className="text-stone mt-1 text-sm">
        Nadie puede reservar fuera de este horario, aunque el profesional trabaje más.
      </p>
      <ul className="divide-line border-line mt-5 divide-y rounded-2xl border">
        {[1, 2, 3, 4, 5, 6, 0].map((w) => {
          const d = days.find((x) => x.weekday === w)!;
          return (
            <li key={w} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <span className="w-24">{DAYS[w]}</span>
              <Switch
                checked={!d.closed}
                onChange={(open) => update(w, { closed: !open })}
                label={`${DAYS[w]}: abierto`}
              />
              {d.closed ? (
                <span className="text-stone text-sm">Cerrado</span>
              ) : (
                <span className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${DAYS[w]}: abre`}
                    value={d.open}
                    onChange={(e) => update(w, { open: e.target.value })}
                    className="tabular border-line bg-paper h-10 rounded-lg border px-2"
                  />
                  <span className="text-stone">a</span>
                  <input
                    type="time"
                    aria-label={`${DAYS[w]}: cierra`}
                    value={d.close}
                    onChange={(e) => update(w, { close: e.target.value })}
                    className="tabular border-line bg-paper h-10 rounded-lg border px-2"
                  />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <SaveBar
        dirty={dirty}
        busy={save.isPending}
        onSave={() =>
          save.mutate(
            { section: 'openingHours', value: days },
            {
              onSuccess: () => toast('Horario guardado'),
              onError: (e) => toast(e.message, 'error'),
            },
          )
        }
      />
    </>
  );
}

// ───────────── Redes ─────────────

function SocialSection({ value }: { value: Settings['social'] }) {
  const save = useSaveSettings();
  const toast = useToast();
  const initial = () => ({
    instagram: value.instagram ?? '',
    facebook: value.facebook ?? '',
    tiktok: value.tiktok ?? '',
    website: value.website ?? '',
    whatsapp: value.whatsapp ?? '',
  });
  const [f, setF] = useState(initial);
  useEffect(() => setF(initial()), [value]);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial());
  const field = (k: keyof typeof f, label: string, placeholder: string) => (
    <Field label={label} htmlFor={`so-${k}`}>
      <TextInput
        id={`so-${k}`}
        value={f[k]}
        placeholder={placeholder}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
      />
    </Field>
  );
  return (
    <>
      <Group title="Redes sociales" hint="Aparecen en el pie de la web. Deja vacío lo que no uses.">
        {field('instagram', 'Instagram', 'https://instagram.com/tunegocio')}
        {field('facebook', 'Facebook', 'https://facebook.com/tunegocio')}
        {field('tiktok', 'TikTok', 'https://tiktok.com/@tunegocio')}
        {field('website', 'Otro sitio web', 'https://…')}
      </Group>
      <SaveBar
        dirty={dirty}
        busy={save.isPending}
        onSave={() =>
          save.mutate(
            { section: 'social', value: f },
            {
              onSuccess: () => toast('Redes guardadas'),
              onError: (e) => toast(e.message, 'error'),
            },
          )
        }
      />
    </>
  );
}

// ───────────── Apariencia ─────────────

const PRESET_INFO: Record<BrandPreset, { label: string; for: string; material: string }> = {
  studio: { label: 'Estudio', for: 'Neutro, sirve para todo', material: 'cerámica' },
  barber: { label: 'Barbería', for: 'Oscuro, con latón', material: 'latón cepillado' },
  spa: { label: 'Spa', for: 'Arena y salvia', material: 'piedra' },
  nails: { label: 'Uñas', for: 'Hueso y cereza', material: 'laca' },
  beauty: { label: 'Belleza', for: 'Papel y terracota', material: 'seda' },
  clasico: { label: 'Clásica', for: 'Carbón y rojo de barbería', material: 'acero' },
  ingles: { label: 'Inglesa', for: 'Verde oscuro y latón', material: 'latón' },
  ebano: { label: 'Ébano', for: 'Negro y dorado', material: 'ébano' },
};

function BrandingSection({ value, info }: { value: Settings['branding']; info: BusinessInfo }) {
  const save = useSaveSettings();
  const saveBusiness = useSaveBusiness();
  const toast = useToast();
  const [f, setF] = useState(value);
  useEffect(() => setF(value), [value]);
  const dirty = JSON.stringify(f) !== JSON.stringify(value);
  const preset = PRESETS[f.preset];
  const lowContrast = (c: string) => contrastRatio(c, preset.paper) < 3;

  return (
    <>
      <section className="mb-8">
        <h2 className="font-display text-2xl">Estilo</h2>
        <p className="text-stone mt-1 text-sm">
          {info.style === 'BARBER'
            ? 'Paletas del diseño de barbería: cambian los colores de tu página y de este panel.'
            : 'Colores, tipografía y el objeto 3D de la portada cambian con el estilo.'}
        </p>
        <div
          role="radiogroup"
          aria-label="Estilo"
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {presetsFor(info.style).map((k) => {
            const p = PRESETS[k];
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={f.preset === k}
                onClick={() =>
                  setF({ ...f, preset: k, primaryColor: '#141412', secondaryColor: '#A8854A' })
                }
                className="aria-checked:border-ink aria-checked:ring-ink overflow-hidden rounded-2xl border text-left aria-checked:ring-1"
                style={{ borderColor: f.preset === k ? undefined : 'var(--line)' }}
              >
                <div
                  className="flex h-20 items-end justify-between p-3"
                  style={{ background: p.paper, color: p.ink }}
                >
                  <span className="font-display text-2xl leading-none">Aa</span>
                  <span className="flex gap-1">
                    {[p.ink, p.accent, p.stone].map((c) => (
                      <span key={c} className="size-3 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm">{PRESET_INFO[k].label}</p>
                  <p className="text-stone text-xs">
                    {PRESET_INFO[k].for} · {PRESET_INFO[k].material}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Group
        title="Colores propios (opcional)"
        hint="Si un color no se lee bien sobre el fondo, la web usa el del estilo."
      >
        <ColorField
          label="Color principal (botones)"
          value={f.primaryColor === '#141412' ? preset.brand : f.primaryColor}
          warn={lowContrast(f.primaryColor === '#141412' ? preset.brand : f.primaryColor)}
          onChange={(primaryColor) => setF({ ...f, primaryColor })}
        />
        <ColorField
          label="Color de acento"
          value={f.secondaryColor === '#A8854A' ? preset.accent : f.secondaryColor}
          warn={lowContrast(f.secondaryColor === '#A8854A' ? preset.accent : f.secondaryColor)}
          onChange={(secondaryColor) => setF({ ...f, secondaryColor })}
        />
      </Group>

      <Group title="Portada">
        <Field label="Título" htmlFor="br-title" hint="La última palabra se destaca en cursiva.">
          <TextInput
            id="br-title"
            maxLength={120}
            value={f.heroTitle}
            onChange={(e) => setF({ ...f, heroTitle: e.target.value })}
          />
        </Field>
        <Field label="Subtítulo" htmlFor="br-sub">
          <TextInput
            id="br-sub"
            maxLength={200}
            value={f.heroSubtitle}
            onChange={(e) => setF({ ...f, heroSubtitle: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Switch
            checked={f.animations}
            onChange={(animations) => setF({ ...f, animations })}
            label="Animaciones y objeto 3D en la portada"
            showLabel
          />
        </div>
      </Group>

      <div
        className="border-line mb-8 overflow-hidden rounded-2xl border"
        aria-label="Vista previa"
      >
        <div className="p-6" style={{ background: preset.paper, color: preset.ink }}>
          <p className="text-xs tracking-[0.16em] uppercase" style={{ color: preset.stone }}>
            Vista previa
          </p>
          <p className="font-display mt-3 text-4xl leading-none font-light">
            {f.heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
            <em
              style={{
                color:
                  lowContrast(f.secondaryColor) || f.secondaryColor === '#A8854A'
                    ? preset.accent
                    : f.secondaryColor,
              }}
            >
              {f.heroTitle.split(' ').slice(-1)}
            </em>
          </p>
          <p className="mt-3 text-sm" style={{ color: preset.stone }}>
            {f.heroSubtitle}
          </p>
          <span
            className="mt-5 inline-flex h-10 items-center rounded-full px-5 text-sm"
            style={{
              background:
                f.primaryColor === '#141412' || lowContrast(f.primaryColor)
                  ? preset.brand
                  : f.primaryColor,
              color: preset.paper,
            }}
          >
            Reservar cita
          </span>
        </div>
      </div>

      <Group title="Imágenes">
        <ImageUpload
          label="Logo"
          value={info.logoUrl}
          onChange={(logoUrl) =>
            saveBusiness.mutate({ logoUrl }, { onSuccess: () => toast('Logo actualizado') })
          }
        />
        <ImageUpload
          label="Imagen principal (para compartir)"
          value={info.heroImageUrl}
          shape="wide"
          onChange={(heroImageUrl) =>
            saveBusiness.mutate({ heroImageUrl }, { onSuccess: () => toast('Imagen actualizada') })
          }
        />
      </Group>

      <SaveBar
        dirty={dirty}
        busy={save.isPending}
        onSave={() =>
          save.mutate(
            { section: 'branding', value: f },
            {
              onSuccess: () => toast('Apariencia guardada. Tu web se actualiza en un minuto.'),
              onError: (e) => toast(e.message, 'error'),
            },
          )
        }
      />
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
  warn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  warn: boolean;
}) {
  const id = label.replace(/\W/g, '');
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={warn ? 'Poco contraste con el fondo: se usará el color del estilo.' : undefined}
    >
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="border-line bg-paper h-11 w-14 cursor-pointer rounded-lg border p-1"
        />
        <span className="text-stone font-mono text-sm">{value}</span>
      </div>
    </Field>
  );
}

// ───────────── Reservas ─────────────

function BookingSection({ value }: { value: Settings['booking'] }) {
  const save = useSaveSettings();
  const toast = useToast();
  const [f, setF] = useState(value);
  useEffect(() => setF(value), [value]);
  const dirty = JSON.stringify(f) !== JSON.stringify(value);
  const sel = (k: keyof typeof f, label: string, options: [number, string][], hint?: string) => (
    <Field label={label} htmlFor={`bk-${k}`} hint={hint}>
      <Select
        id={`bk-${k}`}
        value={String(f[k])}
        onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </Field>
  );

  return (
    <>
      <Group title="Cuándo se puede reservar">
        {sel(
          'slotStepMinutes',
          'Horas cada',
          [
            [10, '10 minutos'],
            [15, '15 minutos'],
            [20, '20 minutos'],
            [30, '30 minutos'],
            [60, '1 hora'],
          ],
          'Cada cuánto se ofrecen horas: 9:00, 9:15…',
        )}
        {sel('minAdvanceMinutes', 'Anticipación mínima', [
          [0, 'Sin mínimo'],
          [30, '30 minutos'],
          [60, '1 hora'],
          [120, '2 horas'],
          [240, '4 horas'],
          [1440, '1 día'],
        ])}
        {sel('maxAdvanceDays', 'Hasta cuántos días adelante', [
          [7, '1 semana'],
          [14, '2 semanas'],
          [30, '1 mes'],
          [60, '2 meses'],
          [90, '3 meses'],
        ])}
        {sel(
          'bufferMinutes',
          'Tiempo libre entre citas',
          [
            [0, 'Ninguno'],
            [5, '5 minutos'],
            [10, '10 minutos'],
            [15, '15 minutos'],
            [30, '30 minutos'],
          ],
          'Para limpiar o preparar.',
        )}
        {sel('cancellationWindowHours', 'El cliente puede cancelar hasta', [
          [0, 'Cualquier momento'],
          [2, '2 horas antes'],
          [4, '4 horas antes'],
          [12, '12 horas antes'],
          [24, '1 día antes'],
          [48, '2 días antes'],
        ])}
      </Group>

      <section className="mb-8 space-y-4">
        <h2 className="font-display text-2xl">Confirmación y pago</h2>
        <Switch
          checked={f.autoConfirm}
          onChange={(autoConfirm) => setF({ ...f, autoConfirm })}
          label="Confirmar las reservas automáticamente (si no, quedan pendientes hasta que las confirmes)"
          showLabel
        />
        <fieldset>
          <legend className="mb-2 text-sm">Pago en línea al reservar</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ['NONE', 'No cobrar en línea', 'Se paga en el local'],
                ['OPTIONAL', 'Opcional', 'El cliente elige si paga antes'],
                ['REQUIRED', 'Obligatorio', 'La cita se confirma al pagar'],
              ] as const
            ).map(([v, l, d]) => (
              <label
                key={v}
                className={`cursor-pointer rounded-2xl border p-4 ${f.paymentMode === v ? 'border-ink bg-paper-2' : 'border-line'}`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  className="sr-only"
                  checked={f.paymentMode === v}
                  onChange={() => setF({ ...f, paymentMode: v })}
                />
                <span className="block">{l}</span>
                <span className="text-stone block text-sm">{d}</span>
              </label>
            ))}
          </div>
          {f.paymentMode !== 'NONE' && (
            <p className="text-stone mt-2 text-sm">
              Necesitas conectar Wompi en Pagos para cobrar en línea.
            </p>
          )}
        </fieldset>
      </section>

      <SaveBar
        dirty={dirty}
        busy={save.isPending}
        onSave={() =>
          save.mutate(
            { section: 'booking', value: f },
            {
              onSuccess: () => toast('Reglas de reserva guardadas'),
              onError: (e) => toast(e.message, 'error'),
            },
          )
        }
      />
    </>
  );
}
