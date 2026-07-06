/**
 * Popula os dados REAIS do "Ranking Elite Beach Tennis":
 * Temporada 2026, campeonato ATIVO com a pontuação real (podium + participação 10),
 * os 18 atletas e a 1ª rodada (02/07/2026) já classificada (sem placares — partimos
 * dos pontos da planilha). Rode DEPOIS do reset-domain, com Club + admin presentes.
 * Uso: pnpm --filter @reb/db seed:real
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@ranking-elite-beach.local').toLowerCase();

// Classificação 1º..18º da 1ª rodada (planilha). Os pontos vêm da COLOCAÇÃO da dupla.
const ATHLETES = [
  'Éberson', 'Yan', // campeões (100)
  'Luis Carlos', 'Mateus', // vice (70)
  'Fabiano', 'Lucas', // 3º (50)
  'Gean', 'Igor', // 4º (30)
  'Bruno Vilela', 'Bruno Pedro', // participação (10)
  'Godoy', 'Gustavo',
  'Sérgio Xingu', 'Mateus Cardoso',
  'Junior Minuci', 'Rafael',
  'Rafael Junior', 'João Alfonso',
];

const MATCH_FORMAT = { sets: 1, gamesPerSet: 6, tieBreakAt: 6, matchTieBreak: false, walkoverGames: 6 };
const SCORING_TABLE = { '1': 100, '2': 70, '3': 50, '4': 30 };
const PARTICIPATION_POINTS = 10;

/** Pontos por posição da dupla (1..): podium via tabela, resto = participação. */
function pointsForPosition(position: number): number {
  return (SCORING_TABLE as Record<string, number>)[String(position)] ?? PARTICIPATION_POINTS;
}

async function main() {
  const club = await prisma.club.findFirst();
  if (!club) throw new Error('Nenhum Club encontrado — rode o seed base (pnpm db:seed) antes.');
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error(`Admin ${ADMIN_EMAIL} não encontrado — rode o seed base antes.`);

  // Temporada + campeonato ATIVO + config (com participação 10).
  const season = await prisma.season.create({
    data: { clubId: club.id, year: 2026, name: 'Temporada 2026', status: 'OPEN' },
  });
  const championship = await prisma.championship.create({
    data: {
      seasonId: season.id,
      name: 'Ranking Elite Beach Tennis',
      roundsCount: 20,
      qualifiersCount: 12,
      status: 'ACTIVE',
      startDate: new Date('2026-07-02'),
      config: {
        create: {
          scoringTable: SCORING_TABLE as Prisma.InputJsonValue,
          participationPoints: PARTICIPATION_POINTS,
          tiebreakers: ['POINTS', 'GAME_BALANCE', 'HEAD_TO_HEAD', 'DRAW'] as Prisma.InputJsonValue,
          drawWeights: { ranking: 0.35, skill: 0.15, partner: 0.35, opponent: 0.15 } as Prisma.InputJsonValue,
          randomness: 50,
          allowRepeatPartners: false,
          allowRepeatOpponents: true,
          finalConfig: { groupSizePreference: 3, format: 'GROUPS_KNOCKOUT' } as Prisma.InputJsonValue,
        },
      },
    },
  });

  // Atletas (birthDate placeholder — organização edita depois).
  const players = [];
  for (const name of ATHLETES) {
    players.push(
      await prisma.player.create({
        data: { clubId: club.id, name, birthDate: new Date('1990-01-01'), skillLevel: 'INTERMEDIATE', status: 'ACTIVE' },
      }),
    );
  }

  // Rodada 1 já FINALIZADA + Draw (obrigatório p/ Team).
  const round = await prisma.round.create({
    data: {
      championshipId: championship.id,
      number: 1,
      date: new Date('2026-07-02'),
      status: 'FINISHED',
      kind: 'REGULAR',
      matchFormat: MATCH_FORMAT as Prisma.InputJsonValue,
      groupSizePref: 3,
    },
  });
  const draw = await prisma.draw.create({
    data: {
      roundId: round.id,
      seed: 'rodada-1-real',
      configSnapshot: {} as Prisma.InputJsonValue,
      qualityScore: 0,
      metrics: {} as Prisma.InputJsonValue,
      explanations: [] as unknown as Prisma.InputJsonValue,
      createdById: admin.id,
    },
  });

  // Duplas por colocação (1º+2º, 3º+4º, …) → RoundResult com os pontos.
  for (let i = 0; i < players.length; i += 2) {
    const position = i / 2 + 1;
    const a = players[i]!;
    const b = players[i + 1]!;
    const team = await prisma.team.create({
      data: {
        roundId: round.id,
        drawId: draw.id,
        label: `Dupla ${position}`,
        strength: 0,
        players: { create: [{ playerId: a.id }, { playerId: b.id }] },
      },
    });
    await prisma.roundResult.create({
      data: { roundId: round.id, teamId: team.id, finalPosition: position, pointsAwarded: pointsForPosition(position) },
    });
    // Inscrições confirmadas (18 participantes da rodada).
    await prisma.registration.createMany({
      data: [
        { roundId: round.id, playerId: a.id, status: 'CONFIRMED' },
        { roundId: round.id, playerId: b.id, status: 'CONFIRMED' },
      ],
    });
  }

  console.log(`OK — Temporada 2026, campeonato "${championship.name}" (ATIVO), 18 atletas e a rodada 1 (02/07/2026) populados.`);
  console.log('Ranking esperado: Éberson/Yan 100 · Luis Carlos/Mateus 70 · Fabiano/Lucas 50 · Gean/Igor 30 · demais 10.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
