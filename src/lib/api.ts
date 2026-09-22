import type {
  AvailabilityDay,
  BookingPayload,
  BusinessProfile,
  BusinessStyle,
  CatalogGroup,
  DaySlots,
  PublicAppointment,
  PublicMessage,
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

/**
 * Endpoints públicos (sin sesión) de un negocio: `publicApi('barberia-demo').catalog()`.
 * Cada empresa vive en su propia dirección (filo.com/<slug>).
 */
export function publicApi(slug: string) {
  const pub = (path: string) => `/public/${encodeURIComponent(slug)}${path}`;
  return {
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
    messages: (token: string) =>
      request<{ messages: PublicMessage[] }>(
        pub(`/appointments/by-token/${encodeURIComponent(token)}/messages`),
      ),
    sendMessage: (token: string, body: string) =>
      request<PublicMessage>(pub(`/appointments/by-token/${encodeURIComponent(token)}/messages`), {
        method: 'POST',
        body: { body },
      }),
    startPayment: (token: string) =>
      request<{ url: string }>(
        pub(`/appointments/by-token/${encodeURIComponent(token)}/payments`),
        {
          method: 'POST',
        },
      ),
    verifyPayment: (token: string, transactionId: string) =>
      request<{ status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' }>(
        pub(`/appointments/by-token/${encodeURIComponent(token)}/payments/verify`),
        { method: 'POST', body: { transactionId } },
      ),
    cancel: (token: string, reason?: string) =>
      request<PublicAppointment>(
        pub(`/appointments/by-token/${encodeURIComponent(token)}/cancel`),
        {
          method: 'POST',
          body: { reason },
        },
      ),
  };
}

/** Para páginas del servidor: si la API no responde, devuelve null en vez de romper la página. */
export async function safely<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export interface SlugCheck {
  slug: string;
  available: boolean;
  reason: string | null;
  suggestion: string;
}

export interface RegisterPayload {
  businessName: string;
  slug: string;
  style: BusinessStyle;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}

/** Endpoints de la plataforma (FILO). El registro abre sesión, así que vive en lib/admin/client.ts. */
export const platformApi = {
  checkSlug: (q: { slug?: string; name?: string }) =>
    request<SlugCheck>('/platform/slug', { query: q }),
  forgotPassword: (email: string) =>
    request<void>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    request<void>('/auth/reset-password', { method: 'POST', body: { token, password } }),
};
