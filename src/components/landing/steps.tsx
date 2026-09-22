import { Reveal } from '@/components/ui/reveal';

const STEPS = [
  ['Elige el servicio', 'Mira la carta con precios y duración antes de decidir.'],
  ['Elige con quién y cuándo', 'Solo verás horas que de verdad están libres.'],
  [
    'Listo',
    'Sin crear cuenta: tu nombre y tu teléfono bastan. Recibes un enlace para ver o cancelar tu cita.',
  ],
];

export function Steps() {
  return (
    <ol className="border-line bg-line grid gap-px overflow-hidden rounded-[22px] border md:grid-cols-3">
      {STEPS.map(([title, body], i) => (
        <Reveal as="li" key={title} delay={i * 0.06} className="bg-paper p-6 md:p-8">
          <span className="font-display text-accent tabular text-5xl font-light">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-6 text-lg font-medium">{title}</h3>
          <p className="text-stone mt-2 leading-relaxed">{body}</p>
        </Reveal>
      ))}
    </ol>
  );
}
