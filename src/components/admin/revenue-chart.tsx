'use client';

import { useState } from 'react';
import { dateParts, formatMoney } from '@/lib/format';

/**
 * Ingresos cobrados por día (una sola serie → sin leyenda, el título la nombra).
 * Barras finas ancladas a la base con punta redondeada, cuadrícula discreta,
 * tooltip por barra y tabla equivalente para lectores de pantalla.
 */
export function RevenueChart({
  data,
  currency,
  today,
}: {
  data: { date: string; revenueCents: number; appointments: number }[];
  currency: string;
  today: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenueCents), 1);
  const nice = niceCeil(max);
  const W = 560;
  const H = 180;
  const pad = { top: 12, bottom: 28, left: 0, right: 0 };
  const plotH = H - pad.top - pad.bottom;
  const slot = W / data.length;
  const barW = Math.max(2, Math.min(36, slot - 2));
  // Rangos largos: etiquetas cada N barras, con el número del día.
  const every = data.length > 14 ? Math.ceil(data.length / 8) : 1;
  const longRange = data.length > 7;

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={`Ingresos de ${data.length} días`}
      >
        {[0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={0}
              x2={W}
              y1={pad.top + plotH * (1 - t)}
              y2={pad.top + plotH * (1 - t)}
              stroke="var(--line)"
              strokeDasharray="2 4"
            />
            <text
              x={W}
              y={pad.top + plotH * (1 - t) - 4}
              textAnchor="end"
              className="fill-stone text-[11px]"
            >
              {formatMoney(nice * t * 1, currency)}
            </text>
          </g>
        ))}
        <line x1={0} x2={W} y1={pad.top + plotH} y2={pad.top + plotH} stroke="var(--line)" />
        {data.map((d, i) => {
          const h = (d.revenueCents / nice) * plotH;
          const x = i * slot + (slot - barW) / 2;
          const y = pad.top + plotH - h;
          const r = Math.min(4, h / 2, barW / 2);
          const p = dateParts(d.date);
          return (
            <g
              key={d.date}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              {/* área de toque más grande que la barra */}
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${pad.top + plotH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${pad.top + plotH} Z`}
                  fill="var(--accent)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {(i % every === 0 || d.date === today) && (
                <text
                  x={i * slot + slot / 2}
                  y={H - 8}
                  textAnchor="middle"
                  className={`text-[11px] ${d.date === today ? 'fill-ink' : 'fill-stone'}`}
                >
                  {d.date === today ? 'hoy' : longRange ? p.day : p.weekday}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          role="status"
          className="border-line bg-paper pointer-events-none absolute -top-2 rounded-lg border px-3 py-2 text-sm shadow-md"
          style={{
            left: `${((hover + 0.5) / data.length) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-stone first-letter:uppercase">
            {dateParts(data[hover].date).weekday} {dateParts(data[hover].date).day}
          </p>
          <p className="tabular">{formatMoney(data[hover].revenueCents, currency)}</p>
          <p className="text-stone text-xs">{data[hover].appointments} cita(s) completadas</p>
        </div>
      )}

      <table className="sr-only">
        <caption>Ingresos por día</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.date}</th>
              <td>{formatMoney(d.revenueCents, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Tope "redondo" del eje: 1, 2 o 5 × 10ⁿ. */
function niceCeil(v: number) {
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}
