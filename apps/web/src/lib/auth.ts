import { cookies } from 'next/headers';
import type { AuthUser, LoginResponse, TokenPair } from '@reb/contracts';

export const ACCESS_COOKIE = 'reb_access';
export const REFRESH_COOKIE = 'reb_refresh';

const ACCESS_MAX_AGE = Number(process.env.JWT_ACCESS_TTL ?? 900);
const REFRESH_MAX_AGE = Number(process.env.JWT_REFRESH_TTL ?? 604800);

export const apiUrl = () => process.env.API_URL ?? 'http://localhost:3333';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/** Grava os tokens em cookies httpOnly (chamar em Route Handlers). */
export function setAuthCookies(tokens: TokenPair): void {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...baseCookieOptions, maxAge: ACCESS_MAX_AGE });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookieOptions, maxAge: REFRESH_MAX_AGE });
}

export function clearAuthCookies(): void {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Faz login na API e retorna a resposta (tokens + user). */
export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${apiUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Falha no login');
  }
  return res.json();
}

/** Retorna o usuário autenticado usando o access token do cookie, ou null. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(`${apiUrl()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}
