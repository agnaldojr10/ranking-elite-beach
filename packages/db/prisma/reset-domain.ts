/**
 * Limpa TODOS os dados de domínio (jogadores, campeonatos, rodadas, resultados,
 * convites, push, contas de atleta), mantendo apenas o Club e o usuário ADMIN.
 * Uso: pnpm --filter @reb/db reset:domain
 * ATENÇÃO: destrutivo. Roda contra o DATABASE_URL do .env.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@ranking-elite-beach.local').toLowerCase();

async function main() {
  console.log('Limpando dados de domínio (mantendo Club + admin)…');

  // Ordem folha → raiz (mesmo com cascatas, é explícito e seguro).
  await prisma.matchResultLog.deleteMany();
  await prisma.match.deleteMany();
  await prisma.roundResult.deleteMany();
  await prisma.groupTeam.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teamPlayer.deleteMany();
  await prisma.team.deleteMany();
  await prisma.draw.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.round.deleteMany();
  await prisma.championshipConfig.deleteMany();
  await prisma.championship.deleteMany();
  await prisma.season.deleteMany();
  await prisma.partnerHistory.deleteMany();
  await prisma.opponentHistory.deleteMany();
  await prisma.playerInvite.deleteMany();
  await prisma.pushSubscription.deleteMany();

  // Contas de atleta/teste (mantém só o admin).
  const users = await prisma.user.deleteMany({ where: { email: { not: ADMIN_EMAIL } } });
  const players = await prisma.player.deleteMany();

  console.log(`OK — removidos ${players.count} jogadores e ${users.count} usuários (não-admin).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
