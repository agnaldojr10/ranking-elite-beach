/**
 * Corrige as DUPLAS da rodada 1 no banco já populado (sem re-seedar tudo):
 * reconstrói Team/TeamPlayer/RoundResult da rodada 1 com as duplas reais e grava
 * PartnerHistory (para o sorteio das próximas rodadas não repetir as duplas).
 * Mantém jogadores, inscrições, contas e o resto intactos.
 * Uso: pnpm --filter @reb/db fix:round1
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROUND1_PAIRS: [string, string][] = [
  ['Éberson', 'Yan'],
  ['Luis Carlos', 'Mateus'],
  ['Fabiano', 'Lucas'],
  ['Gean', 'Igor'],
  ['Godoy', 'Bruno Pedro'],
  ['Bruno Vilela', 'Gustavo'],
  ['Mateus Cardoso', 'Junior Minuci'],
  ['Sérgio Xingu', 'Rafael'],
  ['Rafael Junior', 'João Alfonso'],
];
const SCORING_TABLE: Record<string, number> = { '1': 100, '2': 70, '3': 50, '4': 30 };
const PARTICIPATION = 10;
const pts = (pos: number) => SCORING_TABLE[String(pos)] ?? PARTICIPATION;
const normalize = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

async function main() {
  const champ = await prisma.championship.findFirst({
    where: { name: 'Ranking Elite Beach Tennis' },
    select: { id: true, season: { select: { clubId: true } } },
  });
  if (!champ) throw new Error('campeonato não encontrado');
  const clubId = champ.season.clubId;
  const round = await prisma.round.findFirst({
    where: { championshipId: champ.id, number: 1 },
    select: { id: true },
  });
  if (!round) throw new Error('rodada 1 não encontrada');

  const players = await prisma.player.findMany({ where: { clubId }, select: { id: true, name: true } });
  const idByName = new Map(players.map((p) => [p.name, p.id]));
  const idOf = (n: string) => {
    const id = idByName.get(n);
    if (!id) throw new Error(`jogador não encontrado: ${n}`);
    return id;
  };

  const draw = await prisma.draw.findFirst({ where: { roundId: round.id }, select: { id: true } });
  if (!draw) throw new Error('draw da rodada 1 não encontrado');

  await prisma.$transaction(async (tx) => {
    // limpa duplas/resultados/histórico anteriores da rodada 1
    await tx.roundResult.deleteMany({ where: { roundId: round.id } });
    await tx.teamPlayer.deleteMany({ where: { team: { roundId: round.id } } });
    await tx.team.deleteMany({ where: { roundId: round.id } });
    await tx.partnerHistory.deleteMany({ where: { clubId } });

    for (let i = 0; i < ROUND1_PAIRS.length; i++) {
      const position = i + 1;
      const [na, nb] = ROUND1_PAIRS[i]!;
      const aId = idOf(na);
      const bId = idOf(nb);
      const team = await tx.team.create({
        data: {
          roundId: round.id,
          drawId: draw.id,
          label: `Dupla ${position}`,
          strength: 0,
          players: { create: [{ playerId: aId }, { playerId: bId }] },
        },
      });
      await tx.roundResult.create({
        data: { roundId: round.id, teamId: team.id, finalPosition: position, pointsAwarded: pts(position) },
      });
      const [pA, pB] = normalize(aId, bId);
      await tx.partnerHistory.create({
        data: { clubId, playerAId: pA, playerBId: pB, timesTogether: 1, lastRoundId: round.id },
      });
    }
  });

  console.log('OK — rodada 1 reconstruída com as duplas reais + 9 linhas de PartnerHistory.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
