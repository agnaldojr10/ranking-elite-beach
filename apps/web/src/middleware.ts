import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'reb_access';
const REFRESH_COOKIE = 'reb_refresh';
const apiUrl = () => process.env.API_URL ?? 'http://localhost:3333';

/**
 * Protege rotas autenticadas. Se o access token expirou mas há refresh válido,
 * renova e grava novos cookies transparentemente. Caso contrário, manda ao /login.
 */
export async function middleware(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (access) {
    return NextResponse.next();
  }

  if (refresh) {
    try {
      const res = await fetch(`${apiUrl()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
        cache: 'no-store',
      });
      if (res.ok) {
        const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
        const response = NextResponse.next();
        const secure = process.env.NODE_ENV === 'production';
        response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure,
          path: '/',
          maxAge: Number(process.env.JWT_ACCESS_TTL ?? 900),
        });
        response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure,
          path: '/',
          maxAge: Number(process.env.JWT_REFRESH_TTL ?? 604800),
        });
        return response;
      }
    } catch {
      // cai para o redirect abaixo
    }
  }

  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/players/:path*',
    '/seasons/:path*',
    '/championships/:path*',
    '/rounds/:path*',
    '/venues/:path*',
    '/calendar/:path*',
  ],
};
