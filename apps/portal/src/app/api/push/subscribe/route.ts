import { NextResponse } from 'next/server';
import { PushSubscriptionInputSchema } from '@reb/contracts';
import { apiFetch } from '@/lib/api';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PushSubscriptionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: 'Assinatura inválida' } }, { status: 400 });
  }
  const res = await apiFetch('/me/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) {
    return NextResponse.json({ error: { message: res.message } }, { status: res.status });
  }
  return new NextResponse(null, { status: 204 });
}
