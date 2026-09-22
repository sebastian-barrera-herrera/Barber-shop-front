'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Field, Select, TextInput } from '@/components/admin/form';
import { ImageUpload } from '@/components/admin/image-upload';
import { EmptyState, NoAccess, PageHeader, PageShell } from '@/components/admin/page-header';
import { Switch } from '@/components/admin/switch';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/toast';
import { formatDuration, formatMoney } from '@/lib/format';
import { useAuth } from '@/lib/admin/auth';
import {
  useCategories,
  useDeleteCategory,
  useDeleteService,
  useSaveCategory,
  useSaveService,
  useServicesAll,
  type ServiceFull,
} from '@/lib/admin/hooks';

const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240];
const NEW_CATEGORY = '__nueva__';

function ServiciosInner() {
  const params = useSearchParams();
  const router = useRouter();
  const services = useServicesAll();
  const categories = useCategories();
  const save = useSaveService();
  const toast = useToast();
  const [editing, setEditing] = useState<ServiceFull | 'new' | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  // Abrir desde el buscador (?id=)
  useEffect(() => {
    const id = params.get('id');
    const found = id && services.data?.find((s) => s.id === id);
    if (found) {
      setEditing(found);
      router.replace('/admin/servicios', { scroll: false });
    }
  }, [params, services.data, router]);

  const groups = useMemo(() => {
    const list = services.data ?? [];
    const cats = (categories.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      items: list.filter((s) => s.category?.id === c.id),
    }));
    const none = list.filter((s) => !s.category);
    return [
      ...cats.filter((c) => c.items.length),
      ...(none.length ? [{ id: 'none', name: 'Sin categoría', items: none }] : []),
    ];
  }, [services.data, categories.data]);

  const toggle = (s: ServiceFull, isActive: boolean) =>
    save.mutate(
      { id: s.id, isActive },
      {
        onSuccess: () =>
          toast(isActive ? `${s.name} disponible para reservar` : `${s.name} pausado`),
        onError: (e) => toast(e.message, 'error'),
      },
    );

  return (
    <PageShell>
      <PageHeader
        title="Servicios"
        description="Lo que el cliente ve en la carta y puede reservar. Pausa un servicio para ocultarlo sin borrarlo."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="lg" onClick={() => setManagingCategories(true)}>
              Categorías
            </Button>
            <Button size="lg" onClick={() => setEditing('new')}>
              + Agregar servicio
            </Button>
          </div>
        }
      />

      {services.data && !services.data.length ? (
        <EmptyState
          title="Agrega tu primer servicio"
          body="Nombre, precio y duración: con eso ya aparece en la web para reservar."
          action={<Button onClick={() => setEditing('new')}>Agregar servicio</Button>}
        />
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`g-${g.id}`}>
              <h2
                id={`g-${g.id}`}
                className="border-ink/80 font-display mb-2 border-b pb-2 text-2xl"
              >
                {g.name}
              </h2>
              <ul className="divide-line divide-y">
                {g.items.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditing(s)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className={`block truncate ${s.isActive ? '' : 'text-stone'}`}>
                        {s.name}
                      </span>
                      <span className="text-stone block text-sm">
                        {formatDuration(s.durationMinutes)} · {s._count.professionals} profesional
                        {s._count.professionals === 1 ? '' : 'es'}
                        {!s.isActive && ' · pausado'}
                      </span>
                    </button>
                    <span className="tabular shrink-0">{formatMoney(s.priceCents)}</span>
                    <Switch
                      checked={s.isActive}
                      onChange={(v) => toggle(s, v)}
                      label={`${s.name}: disponible para reservar`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ServiceDrawer value={editing} onClose={() => setEditing(null)} />
      <CategoriesDrawer open={managingCategories} onClose={() => setManagingCategories(false)} />
    </PageShell>
  );
}

function ServiceDrawer({
  value,
  onClose,
}: {
  value: ServiceFull | 'new' | null;
  onClose: () => void;
}) {
  const categories = useCategories();
  const save = useSaveService();
  const saveCategory = useSaveCategory();
  const remove = useDeleteService();
  const toast = useToast();
  const isNew = value === 'new';
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    newCategory: '',
    pesos: '',
    duration: 30,
    imageUrl: null as string | null,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!value) return;
    setError(null);
    setConfirmDelete(false);
    setForm(
      value === 'new'
        ? {
            name: '',
            description: '',
            categoryId: categories.data?.[0]?.id ?? '',
            newCategory: '',
            pesos: '',
            duration: 30,
            imageUrl: null,
            isActive: true,
          }
        : {
            name: value.name,
            description: value.description ?? '',
            categoryId: value.category?.id ?? '',
            newCategory: '',
            pesos: String(Math.round(value.priceCents / 100)),
            duration: value.durationMinutes,
            imageUrl: value.imageUrl,
            isActive: value.isActive,
          },
    );
  }, [value, categories.data]);

  const submit = async () => {
    setError(null);
    const pesos = Number(form.pesos.replace(/\D/g, ''));
    if (form.name.trim().length < 2) return setError('Escribe el nombre del servicio');
    if (!form.pesos || !Number.isFinite(pesos)) return setError('Escribe el precio');
    try {
      let categoryId: string | null = form.categoryId || null;
      if (form.categoryId === NEW_CATEGORY) {
        if (form.newCategory.trim().length < 2)
          return setError('Escribe el nombre de la nueva categoría');
        categoryId = (await saveCategory.mutateAsync({ name: form.newCategory.trim() })).id;
      }
      await save.mutateAsync({
        ...(isNew ? {} : { id: (value as ServiceFull).id }),
        name: form.name.trim(),
        description: form.description.trim() || (isNew ? undefined : null),
        categoryId,
        priceCents: pesos * 100,
        durationMinutes: form.duration,
        imageUrl: form.imageUrl,
        isActive: form.isActive,
      });
      toast(isNew ? 'Servicio agregado' : 'Cambios guardados');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar');
    }
  };

  return (
    <Drawer
      open={!!value}
      onClose={onClose}
      title={isNew ? 'Agregar servicio' : 'Editar servicio'}
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
            disabled={save.isPending}
            onClick={() => void submit()}
          >
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre" htmlFor="s-name">
          <TextInput
            id="s-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Corte clásico"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (pesos)" htmlFor="s-price">
            <TextInput
              id="s-price"
              inputMode="numeric"
              value={
                form.pesos ? Number(form.pesos.replace(/\D/g, '')).toLocaleString('es-CO') : ''
              }
              onChange={(e) => setForm({ ...form, pesos: e.target.value.replace(/\D/g, '') })}
              placeholder="35.000"
            />
          </Field>
          <Field label="Duración" htmlFor="s-dur">
            <Select
              id="s-dur"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Categoría" htmlFor="s-cat">
          <Select
            id="s-cat"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Sin categoría</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ Nueva categoría…</option>
          </Select>
        </Field>
        {form.categoryId === NEW_CATEGORY && (
          <Field label="Nombre de la nueva categoría" htmlFor="s-newcat">
            <TextInput
              id="s-newcat"
              value={form.newCategory}
              onChange={(e) => setForm({ ...form, newCategory: e.target.value })}
              placeholder="Uñas"
            />
          </Field>
        )}
        <Field label="Descripción (opcional)" htmlFor="s-desc" hint="Una línea que ayude a elegir.">
          <textarea
            id="s-desc"
            rows={2}
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border-line bg-paper hover:border-stone focus:border-ink w-full rounded-xl border px-3.5 py-2.5 focus:outline-none"
          />
        </Field>
        <ImageUpload
          label="Foto (opcional)"
          value={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
          shape="wide"
        />
        <Switch
          checked={form.isActive}
          onChange={(isActive) => setForm({ ...form, isActive })}
          label="Disponible para reservar"
          showLabel
        />

        {!isNew && (
          <div className="border-line border-t pt-5">
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>¿Eliminar este servicio? Las citas pasadas se conservan.</span>
                <Button
                  className="bg-[#A5473F] text-white hover:bg-[#A5473F]/90"
                  onClick={() =>
                    remove.mutate((value as ServiceFull).id, {
                      onSuccess: () => {
                        toast('Servicio eliminado');
                        onClose();
                      },
                      onError: (e) => setError(e.message),
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
                className="text-stone hover:text-ink text-sm underline underline-offset-2"
              >
                Eliminar servicio
              </button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

function CategoriesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();
  const toast = useToast();
  const [name, setName] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setNames(Object.fromEntries((categories.data ?? []).map((c) => [c.id, c.name])));
  }, [open, categories.data]);

  return (
    <Drawer open={open} onClose={onClose} title="Categorías">
      <div className="space-y-6">
        <p className="text-stone text-sm">
          Agrupan los servicios en la carta. Borrar una categoría no borra sus servicios.
        </p>
        <ul className="divide-line border-line divide-y border-y">
          {(categories.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2.5">
              <label htmlFor={`cat-${c.id}`} className="sr-only">
                Nombre
              </label>
              <TextInput
                id={`cat-${c.id}`}
                value={names[c.id] ?? c.name}
                onChange={(e) => setNames({ ...names, [c.id]: e.target.value })}
              />
              {names[c.id] !== c.name && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    save.mutate(
                      { id: c.id, name: names[c.id] },
                      {
                        onSuccess: () => toast('Categoría renombrada'),
                        onError: (e) => toast(e.message, 'error'),
                      },
                    )
                  }
                >
                  Guardar
                </Button>
              )}
              <button
                type="button"
                onClick={() =>
                  remove.mutate(c.id, { onSuccess: () => toast(`"${c.name}" eliminada`) })
                }
                aria-label={`Eliminar ${c.name}`}
                className="text-stone shrink-0 px-2 text-sm underline underline-offset-2"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <label htmlFor="cat-new" className="sr-only">
            Nueva categoría
          </label>
          <TextInput
            id="cat-new"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nueva categoría"
          />
          <Button
            disabled={name.trim().length < 2}
            onClick={() =>
              save.mutate(
                { name: name.trim() },
                {
                  onSuccess: () => {
                    setName('');
                    toast('Categoría agregada');
                  },
                  onError: (e) => toast(e.message, 'error'),
                },
              )
            }
          >
            Agregar
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default function ServiciosPage() {
  const { canManage } = useAuth();
  if (!canManage) return <NoAccess who="el dueño o el administrador" />;
  return (
    <Suspense>
      <ServiciosInner />
    </Suspense>
  );
}
