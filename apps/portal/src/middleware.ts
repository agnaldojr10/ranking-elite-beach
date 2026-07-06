import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'reb_p_access';
const REFRESH_COOKIE = 'reb_p_refresh';
const apiUrl = () => process.env.API_URL ?? 'http://localhost:3333';

/**
 * Protege as rotas do portal. Renova o access token via refresh quando possível;
 * caso contrário, redireciona ao /login.
 */
export async function middleware(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (access) return NextResponse.next();

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
      // cai para o redirect
    }
  }

  return NextResponse.redirect(new URL('/login', req.url));
}

// Protege a Home e o Perfil; /login e /claim ficam livres.
export const config = {
  matcher: [
    '/',
    '/perfil/:path*',
    '/jogos/:path*',
    '/torneios/:path*',
    '/h2h/:path*',
    '/rodada/:path*',
  ],
};
