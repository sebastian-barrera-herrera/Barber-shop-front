import type { AppointmentStatus } from '@/lib/types';

/** Estados con punto de color + texto (nunca solo color). Mismos tonos en toda la app. */
export const STATUS: Record<AppointmentStatus, { label: string; dot: string; text?: string }> = {
  PENDING: { label: 'Pendiente', dot: 'bg-[#C8912E]' },
  CONFIRMED: { label: 'Confirmada', dot: 'bg-ink' },
  IN_PROGRESS: { label: 'En curso', dot: 'bg-[#3B6FB6]' },
  COMPLETED: { label: 'Completada', dot: 'bg-[#3F8F5B]' },
  CANCELLED: { label: 'Cancelada', dot: 'bg-stone/50', text: 'line-through text-stone' },
  NO_SHOW: { label: 'No asistió', dot: 'bg-[#A5473F]' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status];
  return (
    <span className="border-line inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
      <span aria-hidden className={`size-2 rounded-full ${s.dot}`} />
      <span className={s.text}>{s.label}</span>
    </span>
  );
}
