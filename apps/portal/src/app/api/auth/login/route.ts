import { NextResponse } from 'next/server';
import { LoginRequestSchema } from '@reb/contracts';
import { apiLogin, setAuthCookies } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Dados inválidos' } }, { status: 400 });
  }
  try {
    const result = await apiLogin(parsed.data.email, parsed.data.password);
    setAuthCookies(result);
    return NextResponse.json({ user: result.user });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha no login';
    return NextResponse.json({ error: { message } }, { status: 401 });
  }
}
