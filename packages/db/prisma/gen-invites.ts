/**
 * Gera um convite (PlayerInvite) para cada atleta sem conta e imprime os códigos
 * em claro (para enviar no WhatsApp). O código é guardado como hash SHA-256.
 * Uso: pnpm --filter @reb/db gen:invites
 */
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@ranking-elite-beach.local').toLowerCase();
const TTL_DAYS = 30;

function newCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
    if (i % 4 === 3 && i < 11) out += '-';
  }
  return out;
}
const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error(`Admin ${ADMIN_EMAIL} não encontrado.`);

  // Atletas ainda sem conta (User vinculado) e sem convite ativo pendente.
  const players = await prisma.player.findMany({
    where: { user: null },
    orderBy: { name: 'asc' },
    select: { id: true, clubId: true, name: true },
  });

  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const rows: { name: string; code: string }[] = [];
  for (const p of players) {
    const code = newCode();
    await prisma.playerInvite.create({
      data: { clubId: p.clubId, playerId: p.id, codeHash: hashCode(code), expiresAt, createdById: admin.id },
    });
    rows.push({ name: p.name, code });
  }

  console.log(`\nConvites gerados (${rows.length}) — válidos por ${TTL_DAYS} dias:\n`);
  console.log('ATLETA'.padEnd(22) + 'CÓDIGO');
  console.log('-'.repeat(38));
  for (const r of rows) console.log(r.name.padEnd(22) + r.code);
  console.log('\nEnvie cada código ao respectivo atleta (WhatsApp). Ativação em /claim no portal.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
