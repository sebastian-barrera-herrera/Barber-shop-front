/** Servicios más reservados (30 días): lista con barra de magnitud y el número como texto. */
export function PopularServices({
  items,
}: {
  items: { serviceId: string; name: string; count: number }[];
}) {
  if (!items.length) return <p className="text-stone text-sm">Aún no hay reservas suficientes.</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ol className="space-y-3.5">
      {items.map((s, i) => (
        <li key={s.serviceId}>
          <div className="flex items-baseline justify-between gap-3 text-[0.95rem]">
            <span className="flex gap-3">
              <span className="tabular text-stone w-4">{i + 1}</span>
              {s.name}
            </span>
            <span className="tabular text-stone">{s.count}</span>
          </div>
          <div className="bg-line/60 mt-1.5 ml-7 h-1.5 rounded-full">
            <div
              className="bg-accent h-full rounded-full"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
