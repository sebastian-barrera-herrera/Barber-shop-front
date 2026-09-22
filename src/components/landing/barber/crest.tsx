/**
 * Escudo de barbería: la forma clásica de los letreros, dibujada con el nombre del negocio.
 * No usa ningún logo ajeno; si el negocio sube el suyo, este se reemplaza.
 */
export function Crest({
  name,
  city,
  className = '',
}: {
  name: string;
  city?: string | null;
  className?: string;
}) {
  const initials = name
    .replace(/^(la|el|los|las)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  return (
    <svg viewBox="0 0 220 280" role="img" aria-label={name} className={className}>
      <path
        d="M10 10h200v180c0 8-4 12-10 17l-84 68c-4 3-8 3-12 0l-84-68c-6-5-10-9-10-17V10z"
        fill="var(--brand)"
      />
      <path
        d="M22 22h176v166c0 6-3 9-7 13l-77 62c-3 2-6 2-9 0l-77-62c-4-4-7-7-7-13V22z"
        fill="none"
        stroke="var(--paper)"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      {/* Tijeras finas sobre las iniciales */}
      <g stroke="var(--paper)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M84 58l52 46M136 58l-52 46" />
        <circle cx="80" cy="112" r="9" />
        <circle cx="140" cy="112" r="9" />
      </g>
      <text
        x="110"
        y="186"
        textAnchor="middle"
        fill="var(--paper)"
        style={{
          fontFamily: 'var(--display-face)',
          fontSize: 62,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        {initials}
      </text>
      <text
        x="110"
        y="214"
        textAnchor="middle"
        fill="var(--paper)"
        fillOpacity="0.8"
        style={{ fontFamily: 'var(--font-sans)', fontSize: 15, letterSpacing: 4 }}
      >
        {(city ?? 'BARBERÍA').toUpperCase().slice(0, 16)}
      </text>
    </svg>
  );
}
