'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Field, TextInput } from '@/components/admin/form';
import { ImageUpload } from '@/components/admin/image-upload';
import { EmptyState, NoAccess, PageHeader, PageShell } from '@/components/admin/page-header';
import { Switch } from '@/components/admin/switch';
import { TimeOffEditor } from '@/components/admin/time-off-editor';
import { ScheduleEditor } from '@/components/admin/schedule-editor';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/admin/auth';
import {
  useCategories,
  useCreateAccount,
  useDeleteProfessional,
  useProfessionalsAll,
  useSaveProfessional,
  useServicesAll,
  useSetProfessionalServices,
  type ProfessionalFull,
} from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';

const COLORS = [
  '#3B4A5A',
  '#8A3B4A',
  '#5B6B4E',
  '#8C6A3F',
  '#4B5B8A',
  '#6E4B7A',
  '#3F7A74',
  '#7A5B3F',
];
const WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
type Tab = 'perfil' | 'servicios' | 'horario' | 'libres' | 'acceso';

function ProfesionalesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pros = useProfessionalsAll();
  const save = useSaveProfessional();
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  useEffect(() => {
    const id = params.get('id');
    if (id) {
      setEditingId(id);
      router.replace('/admin/profesionales', { scroll: false });
    }
  }, [params, router]);

  const editing =
    editingId === 'new' ? 'new' : (pros.data?.find((p) => p.id === editingId) ?? null);

  return (
    <PageShell>
      <PageHeader
        title="Profesionales"
        description="Quién atiende, qué servicios hace y en qué horario. Solo se reservan las horas en que cada uno trabaja."
        action={
          <Button size="lg" onClick={() => setEditingId('new')}>
            + Agregar profesional
          </Button>
        }
      />

      {pros.data && !pros.data.length ? (
        <EmptyState
          title="Agrega a tu equipo"
          body="Cada profesional tiene sus servicios y su horario."
          action={<Button onClick={() => setEditingId('new')}>Agregar profesional</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(pros.data ?? []).map((p) => {
            const days = p.workingHours.filter((d) => d.ranges.length).map((d) => WEEK[d.weekday]);
            return (
              <li
                key={p.id}
                className={`border-line rounded-2xl border p-5 ${p.isActive ? '' : 'opacity-70'}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar name={p.name} photoUrl={p.photoUrl} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display flex items-center gap-2 text-xl">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full"
                        style={{ background: p.color }}
                      />
                      {p.name}
                    </p>
                    <p className="text-stone text-sm">{p.title ?? 'Sin cargo'}</p>
                  </div>
                  <Switch
                    checked={p.isActive}
                    label={`${p.name}: recibe reservas`}
                    onChange={(isActive) =>
                      save.mutate(
                        { id: p.id, isActive },
                        {
                          onSuccess: () =>
                            toast(isActive ? `${p.name} recibe reservas` : `${p.name} en pausa`),
                        },
                      )
                    }
                  />
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Servicios</dt>
                    <dd>{p.services.length}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Trabaja</dt>
                    <dd className="text-right">{days.length ? days.join(' · ') : 'Sin horario'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Acceso al panel</dt>
                    <dd>{p.account ? 'Sí' : 'No'}</dd>
                  </div>
                </dl>
                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                  onClick={() => setEditingId(p.id)}
                >
                  Editar
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ProfessionalDrawer
        value={editing}
        onClose={() => setEditingId(null)}
        onCreated={(id) => setEditingId(id)}
      />
    </PageShell>
  );
}

function ProfessionalDrawer({
  value,
  onClose,
  onCreated,
}: {
  value: ProfessionalFull | 'new' | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const business = useBusiness();
  const [tab, setTab] = useState<Tab>('perfil');
  const isNew = value === 'new';
  const pro = isNew ? null : value;

  const valueKey = value === 'new' ? 'new' : (value?.id ?? null);
  useEffect(() => {
    if (valueKey) setTab('perfil');
  }, [valueKey]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'perfil', label: 'Perfil' },
    ...(pro
      ? ([
          { key: 'servicios', label: 'Servicios' },
          { key: 'horario', label: 'Horario' },
          { key: 'libres', label: 'Días libres' },
          ...(user?.role === 'OWNER' ? [{ key: 'acceso', label: 'Acceso' }] : []),
        ] as { key: Tab; label: string }[])
      : []),
  ];

  return (
    <Drawer
      open={!!value}
      onClose={onClose}
      title={isNew ? 'Agregar profesional' : (pro?.name ?? '')}
    >
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Secciones"
          className="-mx-1 mb-6 flex gap-1 overflow-x-auto pb-1"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className="text-stone aria-selected:bg-ink aria-selected:text-paper h-9 shrink-0 rounded-full px-3.5 text-sm"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tab === 'perfil' && (
        <ProfileTab
          value={pro}
          onSaved={(id) => (isNew ? onCreated(id) : undefined)}
          onDeleted={onClose}
        />
      )}
      {tab === 'servicios' && pro && <ServicesTab pro={pro} />}
      {tab === 'horario' && pro && <ScheduleEditor pro={pro} />}
      {tab === 'libres' && pro && (
        <TimeOffEditor
          professionalId={pro.id}
          timezone={business.data?.timezone ?? 'America/Bogota'}
        />
      )}
      {tab === 'acceso' && pro && <AccessTab pro={pro} />}
    </Drawer>
  );
}

function ProfileTab({
  value,
  onSaved,
  onDeleted,
}: {
  value: ProfessionalFull | null;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const save = useSaveProfessional();
  const remove = useDeleteProfessional();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    title: '',
    bio: '',
    photoUrl: null as string | null,
    specialties: '',
    color: COLORS[0],
    instagram: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setError(null);
    setConfirmDelete(false);
    setForm({
      name: value?.name ?? '',
      title: value?.title ?? '',
      bio: value?.bio ?? '',
      photoUrl: value?.photoUrl ?? null,
      specialties: value?.specialties.join(', ') ?? '',
      color: value?.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      instagram: value?.social?.instagram ?? '',
    });
  }, [value]);

  const submit = () => {
    setError(null);
    if (form.name.trim().length < 2) return setError('Escribe el nombre');
    save.mutate(
      {
        ...(value ? { id: value.id } : {}),
        name: form.name.trim(),
        title: form.title.trim() || (value ? null : undefined),
        bio: form.bio.trim() || (value ? null : undefined),
        photoUrl: form.photoUrl,
        color: form.color,
        specialties: form.specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        social: form.instagram.trim() ? { instagram: form.instagram.trim() } : {},
      },
      {
        onSuccess: (p) => {
          toast(
            value
              ? 'Cambios guardados'
              : 'Profesional agregado. Ahora asigna sus servicios y horario.',
          );
          onSaved(p.id);
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <div className="space-y-5">
      <ImageUpload
        label="Foto"
        value={form.photoUrl}
        onChange={(photoUrl) => setForm({ ...form, photoUrl })}
        shape="round"
      />
      <Field label="Nombre" htmlFor="p-name">
        <TextInput
          id="p-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <Field label="Cargo (opcional)" htmlFor="p-title">
        <TextInput
          id="p-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Barbero, manicurista…"
        />
      </Field>
      <Field label="Especialidades (separadas por coma)" htmlFor="p-spec">
        <TextInput
          id="p-spec"
          value={form.specialties}
          onChange={(e) => setForm({ ...form, specialties: e.target.value })}
          placeholder="Fade, Barba, Color"
        />
      </Field>
      <Field label="Presentación corta (opcional)" htmlFor="p-bio">
        <textarea
          id="p-bio"
          rows={3}
          maxLength={500}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="border-line bg-paper hover:border-stone focus:border-ink w-full rounded-xl border px-3.5 py-2.5 focus:outline-none"
        />
      </Field>
      <Field label="Instagram (opcional)" htmlFor="p-ig">
        <TextInput
          id="p-ig"
          value={form.instagram}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          placeholder="https://instagram.com/…"
        />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm">Color en el calendario</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              aria-label={`Color ${c}`}
              aria-pressed={form.color === c}
              className="ring-offset-paper aria-pressed:ring-ink size-8 rounded-full ring-offset-2 aria-pressed:ring-2"
              style={{ background: c }}
            />
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-[#A5473F]">
          {error}
        </p>
      )}
      <Button className="w-full" size="lg" onClick={submit} disabled={save.isPending}>
        {value ? 'Guardar' : 'Agregar'}
      </Button>

      {value && (
        <div className="border-line border-t pt-5">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>¿Eliminar a {value.name}?</span>
              <Button
                className="bg-[#A5473F] text-white hover:bg-[#A5473F]/90"
                onClick={() =>
                  remove.mutate(value.id, {
                    onSuccess: () => {
                      toast('Profesional eliminado');
                      onDeleted();
                    },
                    onError: (e) => {
                      setError(e.message);
                      setConfirmDelete(false);
                    },
                  })
                }
              >
                Sí, eliminar
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                No
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-stone text-sm underline underline-offset-2"
            >
              Eliminar profesional
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ServicesTab({ pro }: { pro: ProfessionalFull }) {
  const services = useServicesAll();
  const categories = useCategories();
  const setServices = useSetProfessionalServices();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set(pro.services.map((s) => s.id)));

  const groups = useMemo(() => {
    const list = (services.data ?? []).filter((s) => s.isActive || selected.has(s.id));
    return [
      ...(categories.data ?? []).map((c) => ({
        name: c.name,
        items: list.filter((s) => s.category?.id === c.id),
      })),
      { name: 'Sin categoría', items: list.filter((s) => !s.category) },
    ].filter((g) => g.items.length);
  }, [services.data, categories.data, selected]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <p className="text-stone text-sm">
        Marca lo que {pro.name} realiza. Solo esos servicios se le podrán reservar.
      </p>
      {groups.map((g) => (
        <fieldset key={g.name}>
          <legend className="eyebrow mb-2">{g.name}</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-stone h-9 rounded-full px-3 text-xs underline underline-offset-2"
              onClick={() => setSelected((prev) => new Set([...prev, ...g.items.map((s) => s.id)]))}
            >
              Todos
            </button>
            {g.items.map((s) => (
              <label
                key={s.id}
                className={`flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm ${selected.has(s.id) ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        className="w-full"
        size="lg"
        disabled={setServices.isPending}
        onClick={() =>
          setServices.mutate(
            { id: pro.id, serviceIds: [...selected] },
            {
              onSuccess: () => toast('Servicios guardados'),
              onError: (e) => toast(e.message, 'error'),
            },
          )
        }
      >
        Guardar servicios ({selected.size})
      </Button>
    </div>
  );
}

function AccessTab({ pro }: { pro: ProfessionalFull }) {
  const create = useCreateAccount();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (pro.account) {
    return (
      <div className="space-y-2">
        <p>
          {pro.name} entra al panel con <span className="font-medium">{pro.account.email}</span>.
        </p>
        <p className="text-stone text-sm">
          Ve su agenda, sus clientes, puede cambiar el estado de sus citas y gestionar su horario.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-stone text-sm">
        Crea un usuario para que {pro.name} vea su agenda desde su teléfono. No podrá ver datos de
        otros profesionales ni la configuración.
      </p>
      <Field label="Correo" htmlFor="a-email">
        <TextInput
          id="a-email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field
        label="Contraseña inicial"
        htmlFor="a-pass"
        hint="Mínimo 8 caracteres. Compártela en persona."
      >
        <TextInput
          id="a-pass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-[#A5473F]">
          {error}
        </p>
      )}
      <Button
        disabled={create.isPending || !email || password.length < 8}
        onClick={() =>
          create.mutate(
            { id: pro.id, email, password },
            { onSuccess: () => toast('Usuario creado'), onError: (e) => setError(e.message) },
          )
        }
      >
        Crear usuario
      </Button>
    </div>
  );
}

export default function ProfesionalesPage() {
  const { canManage } = useAuth();
  if (!canManage) return <NoAccess who="el dueño o el administrador" />;
  return (
    <Suspense>
      <ProfesionalesInner />
    </Suspense>
  );
}
