import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ApiError, publicApi } from './api';
import type { BusinessProfile } from './types';

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

type Loaded =
  { status: 'ok'; business: BusinessProfile } | { status: 'missing' } | { status: 'down' };

/** Una sola petición por render aunque la pidan el layout, la página y los metadatos. */
export const loadBusiness = cache(async (slug: string): Promise<Loaded> => {
  if (!SLUG.test(slug)) return { status: 'missing' };
  try {
    return { status: 'ok', business: await publicApi(slug).business() };
  } catch (e) {
    return e instanceof ApiError && e.status === 404 ? { status: 'missing' } : { status: 'down' };
  }
});

/** La empresa de la ruta; 404 si no existe, null si la API no responde. */
export async function requireBusiness(slug: string): Promise<BusinessProfile | null> {
  const r = await loadBusiness(slug);
  if (r.status === 'missing') notFound();
  return r.status === 'ok' ? r.business : null;
}
