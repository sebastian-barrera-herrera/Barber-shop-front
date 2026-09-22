import { ImageResponse } from 'next/og';
import { publicApi, safely } from '@/lib/api';
import { resolveTheme } from '@/lib/theme';

export const alt = 'Reserva tu cita';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

/** Imagen al compartir el enlace (WhatsApp, Instagram, etc.): nombre y título sobre el papel de la marca. */
export default async function OpenGraphImage() {
  const business = await safely(publicApi.business);
  const theme = resolveTheme(business?.branding);
  const name = business?.name ?? 'Studio';
  const title = business?.branding.heroTitle ?? 'Tu próximo look empieza aquí.';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: theme.paper,
        color: theme.ink,
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 28,
          color: theme.stone,
        }}
      >
        <span>{name}</span>
        <span>Reservas en línea</span>
      </div>
      <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: -3, maxWidth: 950 }}>{title}</div>
      <div style={{ display: 'flex', height: 2, background: theme.ink }} />
    </div>,
    size,
  );
}
