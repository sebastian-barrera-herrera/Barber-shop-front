import { Reveal } from '@/components/ui/reveal';

/** Íconos de trazo, dibujados aquí para no cargar librerías. */
const ICONS: Record<string, string> = {
  scissors:
    'M6 6l12 12M18 6 6 18M5 17.5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M14 17.5a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0',
  razor: 'M4 14l10-10 6 6-10 10H4v-6z M14 4l6 6',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5z',
  pin: 'M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  card: 'M3 7.5h18v11H3v-11zM3 11h18M6.5 15.5h3',
};

const RULES: [keyof typeof ICONS, string, string][] = [
  ['clock', 'Reserva a cualquier hora', 'La agenda está abierta aunque la barbería esté cerrada.'],
  ['scissors', 'Elige tu barbero', 'O deja que te asignemos al primero que se desocupe.'],
  ['star', 'Sin sorpresas', 'Precio y duración de cada servicio, a la vista.'],
  ['razor', 'Hora real', 'Solo ves los turnos que de verdad están libres.'],
  ['pin', 'Llega y siéntate', 'Te esperamos a tu hora; si algo cambia, te avisamos por correo.'],
  ['card', 'Paga como quieras', 'En el local, o en línea al reservar si la barbería lo activa.'],
];

/** "Cómo trabajamos": la retícula de razones del letrero clásico. */
export function HouseRules() {
  return (
    <ul className="border-line bg-line grid gap-px overflow-hidden border md:grid-cols-3">
      {RULES.map(([icon, title, text], i) => (
        <Reveal as="li" key={title} delay={i * 0.05} className="bg-paper p-6 md:p-7">
          <svg viewBox="0 0 24 24" aria-hidden className="text-accent size-7">
            <path
              d={ICONS[icon]}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="font-display mt-4 text-xl">{title}</h3>
          <p className="text-stone mt-1.5 text-[0.95rem] leading-relaxed">{text}</p>
        </Reveal>
      ))}
    </ul>
  );
}
