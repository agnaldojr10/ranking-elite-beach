import { cookies } from 'next/headers';
import type { AuthUser, LoginResponse, TokenPair } from '@reb/contracts';

// Cookies próprios do portal (domínio separado do backoffice).
export const ACCESS_COOKIE = 'reb_p_access';
export const REFRESH_COOKIE = 'reb_p_refresh';

const ACCESS_MAX_AGE = Number(process.env.JWT_ACCESS_TTL ?? 900);
const REFRESH_MAX_AGE = Number(process.env.JWT_REFRESH_TTL ?? 604800);

export const apiUrl = () => process.env.API_URL ?? 'http://localhost:3333';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

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

/** Login por e-mail/senha (atleta que já reivindicou a conta). */
export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  return postAuth('/auth/login', { email, password });
}

/** Reivindicação da conta via código de convite. */
export async function apiClaim(input: {
  code: string;
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return postAuth('/auth/claim', input);
}

async function postAuth(path: string, body: unknown): Promise<LoginResponse> {
  const res = await fetch(`${apiUrl()}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message ?? 'Falha na autenticação');
  }
  return res.json();
}

/** Usuário autenticado (via cookie). Retorna null se não logado ou não for atleta. */
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
