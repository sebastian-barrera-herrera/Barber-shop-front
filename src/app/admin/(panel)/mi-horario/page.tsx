'use client';

import { PageHeader, PageShell } from '@/components/admin/page-header';
import { ScheduleEditor } from '@/components/admin/schedule-editor';
import { TimeOffEditor } from '@/components/admin/time-off-editor';
import { useAuth } from '@/lib/admin/auth';
import { useProfessionalsAll } from '@/lib/admin/hooks';
import { useBusiness } from '@/lib/admin/queries';

/** El profesional gestiona su propio horario y sus días libres. */
export default function MiHorarioPage() {
  const { user } = useAuth();
  const business = useBusiness();
  const pros = useProfessionalsAll();
  const me = pros.data?.find((p) => p.id === user?.professionalId);

  return (
    <PageShell>
      <PageHeader
        title="Mi horario"
        description="Cuándo trabajas y cuándo no. Los clientes solo pueden reservar en tus horas libres."
      />
      {!user?.professionalId ? (
        <p className="text-stone">
          Tu usuario no está vinculado a un profesional. Pídele al dueño que lo vincule.
        </p>
      ) : !me ? (
        <div className="bg-paper-2 h-64 animate-pulse rounded-2xl" />
      ) : (
        <div className="grid gap-12 lg:grid-cols-2">
          <section aria-labelledby="h-semana">
            <h2 id="h-semana" className="font-display mb-4 text-2xl">
              Semana
            </h2>
            <ScheduleEditor pro={me} />
          </section>
          <section aria-labelledby="h-libres">
            <h2 id="h-libres" className="font-display mb-4 text-2xl">
              Días libres y bloqueos
            </h2>
            <TimeOffEditor
              professionalId={me.id}
              timezone={business.data?.timezone ?? 'America/Bogota'}
            />
          </section>
        </div>
      )}
    </PageShell>
  );
}
