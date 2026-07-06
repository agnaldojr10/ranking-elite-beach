/**
 * Popula os dados REAIS do "Ranking Elite Beach Tennis":
 * Temporada 2026, campeonato ATIVO com a pontuação real (podium + participação 10),
 * os 18 atletas e a 1ª rodada (02/07/2026) já classificada (sem placares — partimos
 * dos pontos da planilha), com as DUPLAS reais + histórico de parceria (para o
 * sorteio das próximas rodadas não repetir as duplas). Rode DEPOIS do reset-domain.
 * Uso: pnpm --filter @reb/db seed:real
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@ranking-elite-beach.local').toLowerCase();

// 18 atletas (nomes cadastrados).
const PLAYERS = [
  'Éberson', 'Yan', 'Luis Carlos', 'Mateus', 'Fabiano', 'Lucas', 'Gean', 'Igor',
  'Bruno Vilela', 'Bruno Pedro', 'Godoy', 'Gustavo', 'Sérgio Xingu', 'Mateus Cardoso',
  'Junior Minuci', 'Rafael', 'Rafael Junior', 'João Alfonso',
];

// Duplas REAIS da 1ª rodada, na ordem de colocação (1=campeão … 9=participação).
const ROUND1_PAIRS: [string, string][] = [
  ['Éberson', 'Yan'], // 1º — campeão (100)
  ['Luis Carlos', 'Mateus'], // 2º — vice (70)
  ['Fabiano', 'Lucas'], // 3º (50)
  ['Gean', 'Igor'], // 4º (30)
  ['Godoy', 'Bruno Pedro'], // participação (10)
  ['Bruno Vilela', 'Gustavo'],
  ['Mateus Cardoso', 'Junior Minuci'],
  ['Sérgio Xingu', 'Rafael'],
  ['Rafael Junior', 'João Alfonso'],
];

const MATCH_FORMAT = { sets: 1, gamesPerSet: 6, tieBreakAt: 6, matchTieBreak: false, walkoverGames: 6 };
const SCORING_TABLE = { '1': 100, '2': 70, '3': 50, '4': 30 };
const PARTICIPATION_POINTS = 10;

function pointsForPosition(position: number): number {
  return (SCORING_TABLE as Record<string, number>)[String(position)] ?? PARTICIPATION_POINTS;
}
/** Par normalizado (a<b por string) — igual ao pairKey/normalizePair do domínio. */
function normalize(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function main() {
  const club = await prisma.club.findFirst();
  if (!club) throw new Error('Nenhum Club encontrado — rode o seed base (pnpm db:seed) antes.');
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error(`Admin ${ADMIN_EMAIL} não encontrado — rode o seed base antes.`);

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

  // Atletas (birthDate placeholder — organização edita depois). name → id.
  const idByName = new Map<string, string>();
  for (const name of PLAYERS) {
    const p = await prisma.player.create({
      data: { clubId: club.id, name, birthDate: new Date('1990-01-01'), skillLevel: 'INTERMEDIATE', status: 'ACTIVE' },
    });
    idByName.set(name, p.id);
  }
  const idOf = (name: string) => {
    const id = idByName.get(name);
    if (!id) throw new Error(`Jogador não encontrado no seed: ${name}`);
    return id;
  };

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

  // Duplas reais → Team + RoundResult (pontos por colocação) + inscrições + histórico.
  for (let i = 0; i < ROUND1_PAIRS.length; i++) {
    const position = i + 1;
    const [nameA, nameB] = ROUND1_PAIRS[i]!;
    const aId = idOf(nameA);
    const bId = idOf(nameB);
    const team = await prisma.team.create({
      data: {
        roundId: round.id,
        drawId: draw.id,
        label: `Dupla ${position}`,
        strength: 0,
        players: { create: [{ playerId: aId }, { playerId: bId }] },
      },
    });
    await prisma.roundResult.create({
      data: { roundId: round.id, teamId: team.id, finalPosition: position, pointsAwarded: pointsForPosition(position) },
    });
    await prisma.registration.createMany({
      data: [
        { roundId: round.id, playerId: aId, status: 'CONFIRMED' },
        { roundId: round.id, playerId: bId, status: 'CONFIRMED' },
      ],
    });
    // Histórico de parceria (para o sorteio das próximas rodadas evitar repetir).
    const [pA, pB] = normalize(aId, bId);
    await prisma.partnerHistory.create({
      data: { clubId: club.id, playerAId: pA, playerBId: pB, timesTogether: 1, lastRoundId: round.id },
    });
  }

  console.log(`OK — Temporada 2026, "${championship.name}" (ATIVO), 18 atletas, rodada 1 com as duplas reais + histórico de parceria.`);
  console.log('Ranking: Éberson/Yan 100 · Luis Carlos/Mateus 70 · Fabiano/Lucas 50 · Gean/Igor 30 · demais 10.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
