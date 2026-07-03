import { cookies } from 'next/headers';
import { ACCESS_COOKIE, apiUrl } from './auth';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

/** Fetch autenticado à API (usa o access token do cookie). Para uso em Server Components/Actions. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  const res = await fetch(`${apiUrl()}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return {
      ok: false,
      status: res.status,
      message: body?.error?.message ?? 'Erro na requisição',
    };
  }

  const data = (await res.json().catch(() => null)) as T;
  return { ok: true, data };
}
