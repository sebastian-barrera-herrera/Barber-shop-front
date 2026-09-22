import { ImageResponse } from 'next/og';
import { publicApi, safely } from '@/lib/api';
import { resolveTheme } from '@/lib/theme';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';
export const revalidate = 3600;

/** Favicon: inicial del negocio en tinta sobre papel. */
export default async function Icon() {
  const business = await safely(publicApi.business);
  const theme = resolveTheme(business?.branding);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.ink,
        color: theme.paper,
        borderRadius: 14,
        fontSize: 42,
        fontFamily: 'Georgia, serif',
      }}
    >
      {(business?.name ?? 'S').charAt(0).toUpperCase()}
    </div>,
    size,
  );
}
