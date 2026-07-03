import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';

/** Encerra a sessão limpando os cookies de autenticação. */
export async function POST() {
  clearAuthCookies();
  return NextResponse.json({ ok: true });
}
