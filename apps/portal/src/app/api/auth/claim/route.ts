import { NextResponse } from 'next/server';
import { ClaimRequestSchema } from '@reb/contracts';
import { apiClaim, setAuthCookies } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ClaimRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Dados inválidos';
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
  try {
    const result = await apiClaim(parsed.data);
    setAuthCookies(result);
    return NextResponse.json({ user: result.user });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Não foi possível ativar sua conta';
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
