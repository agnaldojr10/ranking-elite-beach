import { NextRequest, NextResponse } from 'next/server';
import { LoginRequestSchema } from '@reb/contracts';
import { apiLogin, setAuthCookies } from '@/lib/auth';

/** BFF de login: valida, chama a API e grava os tokens em cookies httpOnly. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos' } },
      { status: 400 },
    );
  }

  try {
    const result = await apiLogin(parsed.data.email, parsed.data.password);
    setAuthCookies(result);
    return NextResponse.json({ user: result.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no login';
    return NextResponse.json({ error: { code: 'LOGIN_FAILED', message } }, { status: 401 });
  }
}
