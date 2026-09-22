import { ApiError, type RegisterPayload } from '../api';
import type { SessionUser } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Sesión del panel:
 * - El token de acceso (15 min) vive solo en memoria, nunca en localStorage.
 * - La renovación usa la cookie httpOnly que puso la API (el JS no puede leerla).
 * - Si varias peticiones reciben 401 a la vez, se hace una sola renovación.
 */
let accessToken: string | null = null;
let refreshing: Promise<SessionUser | null> | null = null;
const listeners = new Set<(user: SessionUser | null) => void>();

export function onSessionChange(fn: (user: SessionUser | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setSession(token: string | null, user: SessionUser | null) {
  accessToken = token;
  listeners.forEach((fn) => fn(user));
}

async function raw(path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, { ...init, credentials: 'include' });
}

async function toError(res: Response) {
  const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  return new ApiError(res.status, message || 'Algo salió mal. Intenta de nuevo');
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await raw('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await toError(res);
  const data = (await res.json()) as { accessToken: string; user: SessionUser };
  setSession(data.accessToken, data.user);
  return data.user;
}

/** Registra un negocio nuevo y deja la sesión abierta, como si hubiera iniciado sesión. */
export async function registerBusiness(
  payload: RegisterPayload,
): Promise<{ user: SessionUser; business: { slug: string; style: string } }> {
  const res = await raw('/platform/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toError(res);
  const data = (await res.json()) as {
    accessToken: string;
    user: SessionUser;
    business: { slug: string; style: string };
  };
  setSession(data.accessToken, data.user);
  return { user: data.user, business: data.business };
}

/** Recupera la sesión con la cookie (al abrir el panel o cuando vence el token). */
export function refreshSession(): Promise<SessionUser | null> {
  refreshing ??= (async () => {
    try {
      const res = await raw('/auth/refresh', { method: 'POST' });
      if (!res.ok) {
        setSession(null, null);
        return null;
      }
      const data = (await res.json()) as { accessToken: string; user: SessionUser };
      setSession(data.accessToken, data.user);
      return data.user;
    } catch {
      setSession(null, null);
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function logout() {
  await raw('/auth/logout', { method: 'POST' }).catch(() => undefined);
  setSession(null, null);
}

/** Petición autenticada. Renueva el token una vez si venció. */
export async function adminFetch<T>(
  path: string,
  {
    body,
    query,
    ...init
  }: Omit<RequestInit, 'body'> & {
    body?: unknown;
    query?: Record<string, string | undefined>;
  } = {},
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== '') qs.set(k, v);
  const url = qs.size ? `${path}?${qs}` : path;

  // FormData (archivos) viaja tal cual; lo demás, como JSON.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const send = () =>
    raw(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });

  let res = await send();
  if (res.status === 401 && (await refreshSession())) res = await send();
  if (!res.ok) throw await toError(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}
