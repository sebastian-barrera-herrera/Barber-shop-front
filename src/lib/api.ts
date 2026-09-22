import type {
  AvailabilityDay,
  BookingPayload,
  BusinessProfile,
  CatalogGroup,
  DaySlots,
  PublicAppointment,
  PublicProfessional,
  PublicService,
} from './types';

/**
 * En el servidor se puede usar una URL interna (API_URL, ej. Docker);
 * en el navegador siempre la pública.
 */
const BASE_URL =
  (typeof window === 'undefined' ? process.env.API_URL : undefined) ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

export const BUSINESS_SLUG = process.env.NEXT_PUBLIC_BUSINESS_SLUG || 'studio-demo';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Segundos de caché en el servidor (ISR). Sin valor = sin caché. */
  revalidate?: number;
  query?: Record<string, string | undefined>;
}

async function request<T>(
  path: string,
  { body, revalidate, query, ...init }: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) if (v) url.searchParams.set(k, v);

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new ApiError(
      res.status,
      message || 'No pudimos completar la solicitud. Intenta de nuevo',
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const pub = (path: string) => `/public/${BUSINESS_SLUG}${path}`;

/** Endpoints públicos (sin sesión). */
export const publicApi = {
  business: () => request<BusinessProfile>(pub('/business'), { revalidate: 60 }),
  catalog: () => request<CatalogGroup[]>(pub('/catalog'), { revalidate: 60 }),
  service: (slug: string) =>
    request<PublicService & { professionals: PublicProfessional[] }>(pub(`/services/${slug}`)),
  professionals: (serviceId?: string, revalidate?: number) =>
    request<PublicProfessional[]>(pub('/professionals'), { query: { serviceId }, revalidate }),
  days: (q: { serviceId: string; professionalId?: string; from: string; to: string }) =>
    request<AvailabilityDay[]>(pub('/availability/days'), { query: q }),
  slots: (q: { serviceId: string; professionalId?: string; date: string }) =>
    request<DaySlots>(pub('/availability'), { query: q }),
  book: (payload: BookingPayload) =>
    request<{ appointment: PublicAppointment; manageToken: string }>(pub('/appointments'), {
      method: 'POST',
      body: payload,
    }),
  appointment: (token: string) =>
    request<PublicAppointment>(pub(`/appointments/by-token/${encodeURIComponent(token)}`)),
  cancel: (token: string, reason?: string) =>
    request<PublicAppointment>(pub(`/appointments/by-token/${encodeURIComponent(token)}/cancel`), {
      method: 'POST',
      body: { reason },
    }),
};

/** Para páginas del servidor: si la API no responde, devuelve null en vez de romper la página. */
export async function safely<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
