import Image from 'next/image';
import { initials } from '@/lib/format';

/** Foto del profesional o, si no hay, su inicial en tipografía de título. */
export function Avatar({
  name,
  photoUrl,
  size = 56,
  className = '',
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`border-line bg-paper-2 font-display text-ink inline-flex shrink-0 items-center justify-center rounded-full border ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}
