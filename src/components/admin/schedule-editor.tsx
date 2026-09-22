'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useSetWorkingHours } from '@/lib/admin/hooks';
import { validateWeek, WeeklyHours, type DayHours } from './weekly-hours';

/** Editor del horario semanal de un profesional, con validación antes de guardar. */
export function ScheduleEditor({
  pro,
}: {
  pro: { id: string; name: string; workingHours: DayHours[] };
}) {
  const setHours = useSetWorkingHours();
  const toast = useToast();
  const [week, setWeek] = useState<DayHours[]>(pro.workingHours);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setWeek(pro.workingHours), [pro.workingHours]);

  return (
    <div className="space-y-5">
      <p className="text-stone text-sm">
        Solo se ofrecen para reservar las horas dentro de este horario (y dentro del horario del
        negocio).
      </p>
      <WeeklyHours value={week} onChange={setWeek} />
      {error && (
        <p role="alert" className="text-sm text-[#A5473F]">
          {error}
        </p>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={setHours.isPending}
        onClick={() => {
          const problem = validateWeek(week);
          if (problem) return setError(problem);
          setError(null);
          setHours.mutate(
            { id: pro.id, days: week.filter((d) => d.ranges.length) },
            { onSuccess: () => toast('Horario guardado'), onError: (e) => setError(e.message) },
          );
        }}
      >
        Guardar horario
      </Button>
    </div>
  );
}
