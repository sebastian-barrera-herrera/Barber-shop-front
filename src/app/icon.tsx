import { ImageResponse } from 'next/og';
import { PRESETS } from '@/lib/theme';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

/** Favicon de la plataforma. Cada empresa tiene el suyo en /<slug>. */
export default function Icon() {
  const t = PRESETS.studio;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: t.ink,
        color: t.paper,
        borderRadius: 14,
        fontSize: 40,
        fontFamily: 'Georgia, serif',
      }}
    >
      {(process.env.NEXT_PUBLIC_PLATFORM_NAME || 'FILO').charAt(0)}
    </div>,
    size,
  );
}
