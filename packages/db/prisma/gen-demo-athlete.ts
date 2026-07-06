/**
 * Cria uma CONTA DE ATLETA DE DEMONSTRAÇÃO (fixa) para testar o Portal do Jogador
 * sem consumir os convites dos atletas reais. Idempotente (por e-mail).
 * NÃO faz parte do seed padrão — rode manualmente quando quiser a conta de teste.
 * Uso: pnpm --filter @reb/db gen:demo
 */
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = (process.env.DEMO_ATHLETE_EMAIL ?? 'demo@ranking-elite-beach.local').toLowerCase();
const PASSWORD = process.env.DEMO_ATHLETE_PASSWORD ?? 'admin123';
const PLAYER_NAME = 'Conta Demonstração (portal)';

async function main() {
  const club = await prisma.club.findFirst();
  if (!club) throw new Error('Nenhum Club — rode o seed base antes.');

  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log(`Conta demo já existe: ${EMAIL}`);
    return;
  }

  // Jogador demo INATIVO: não entra em listas ativas/sorteio nem polui o ranking real.
  const player = await prisma.player.create({
    data: {
      clubId: club.id,
      name: PLAYER_NAME,
      birthDate: new Date('1990-01-01'),
      skillLevel: 'INTERMEDIATE',
      status: 'INACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      clubId: club.id,
      email: EMAIL,
      passwordHash: await argon2.hash(PASSWORD),
      role: 'PLAYER',
      playerId: player.id,
      isActive: true,
    },
  });

  console.log(`OK — conta demo do portal criada:\n  e-mail: ${EMAIL}\n  senha:  ${PASSWORD}\n  (jogador "${PLAYER_NAME}", INATIVO — fora do ranking/sorteio)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
