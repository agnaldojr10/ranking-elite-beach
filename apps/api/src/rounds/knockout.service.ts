import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_SCORING_TABLE,
  ScoringTableSchema,
  computeGroupStandings,
  computeRoundPlacement,
  nextStagePairings,
  planKnockout,
  pointsForPlacement,
  STAGE_LABELS,
  type GroupStandings,
  type KnockoutOutcome,
  type KnockoutView,
  type Pairing,
  type RoundResultView,
  type SetScore,
  type StandingMatch,
  type StandingTeam,
} from '@reb/contracts';
import type { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

type TeamRef = { id: string; label: string; playerNames: [string, string] };

@Injectable()
export class KnockoutService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(clubId: string, roundId: string): Promise<KnockoutView> {
    const round = await this.ensureRound(clubId, roundId);

    const groupMatches = await this.prisma.match.findMany({
      where: { phase: 'GROUP', group: { roundId } },
      select: { status: true },
    });
    if (groupMatches.length === 0) {
      throw new ConflictException({
        error: { code: 'KNOCKOUT_NOT_READY', message: 'A rodada não tem fase de grupos gerada' },
      });
    }
    if (groupMatches.some((m) => m.status === 'PENDING')) {
      throw new ConflictException({
        error: {
          code: 'GROUP_STAGE_INCOMPLETE',
          message: 'Lance todos os resultados da fase de grupos antes de gerar o mata-mata',
        },
      });
    }

    const existing = await this.prisma.match.count({ where: { phase: 'KNOCKOUT', roundId } });
    if (existing > 0) {
      throw new ConflictException({
        error: { code: 'KNOCKOUT_EXISTS', message: 'O mata-mata desta rodada já foi gerado' },
      });
    }

    const standings = await this.loadStandings(roundId);
    const plan = planKnockout(standings);

    await this.createStage(round.id, plan.firstStage, plan.firstPairings);
    void round;
    return this.getKnockout(clubId, roundId);
  }

  /** Avança o mata-mata após um resultado; cria próxima fase ou finaliza a rodada. */
  async progress(clubId: string, roundId: string): Promise<void> {
    const matches = await this.prisma.match.findMany({
      where: { phase: 'KNOCKOUT', roundId },
      orderBy: [{ stage: 'asc' }, { slot: 'asc' }],
      select: { id: true, stage: true, slot: true, teamAId: true, teamBId: true, winnerTeamId: true },
    });
    if (matches.length === 0) return;

    const stages = new Set(matches.map((m) => m.stage));
    const inStage = (s: string) =>
      matches.filter((m) => m.stage === s).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
    const complete = (s: string) => {
      const ms = inStage(s);
      return ms.length > 0 && ms.every((m) => m.winnerTeamId);
    };
    const loserOf = (m: { teamAId: string; teamBId: string; winnerTeamId: string | null }) =>
      m.winnerTeamId === m.teamAId ? m.teamBId : m.teamAId;

    // Quartas (repescagem com byes) concluídas → Semifinal: cada bye enfrenta o
    // vencedor da sua chave (slot 0 → bye seed1; slot 1 → bye seed2).
    if (stages.has('QF') && complete('QF') && !stages.has('SF')) {
      const plan = planKnockout(await this.loadStandings(roundId));
      const qf = inStage('QF');
      if (plan.format === 'QUARTER_WITH_BYES' && qf.length === 2 && plan.byes.length === 2) {
        await this.createStage(roundId, 'SF', [
          { slot: 0, teamAId: plan.byes[0]!, teamBId: qf[0]!.winnerTeamId! },
          { slot: 1, teamAId: plan.byes[1]!, teamBId: qf[1]!.winnerTeamId! },
        ]);
        return;
      }
    }

    // Semifinal concluída → Final (vencedores) + disputa de 3º (perdedores).
    if (complete('SF') && !stages.has('F')) {
      const sf = inStage('SF');
      const winners = sf.map((m) => m.winnerTeamId!);
      const losers = sf.map((m) => loserOf(m));
      await this.createStage(roundId, 'F', nextStagePairings(winners));
      if (losers.length === 2) {
        await this.createStage(roundId, '3P', [{ slot: 0, teamAId: losers[0]!, teamBId: losers[1]! }]);
      }
      return;
    }

    // Final (e 3º, se existir) concluída → finaliza a rodada.
    const finalDone = complete('F');
    const thirdPending = stages.has('3P') && !complete('3P');
    if (finalDone && !thirdPending) {
      await this.finalize(clubId, roundId);
    }
  }

  async getKnockout(clubId: string, roundId: string): Promise<KnockoutView> {
    await this.ensureRound(clubId, roundId, false);
    const [matches, standings, teamMap] = await Promise.all([
      this.prisma.match.findMany({
        where: { phase: 'KNOCKOUT', roundId },
        orderBy: [{ stage: 'asc' }, { slot: 'asc' }],
        include: { venue: { select: { name: true } } },
      }),
      this.loadStandings(roundId),
      this.teamMap(roundId),
    ]);

    const bracketSize = planKnockout(standings).qualifierCount;
    return {
      bracketSize,
      generated: matches.length > 0,
      matches: matches.map((m) => ({
        id: m.id,
        stage: m.stage ?? '',
        stageLabel: STAGE_LABELS[m.stage ?? ''] ?? (m.stage ?? ''),
        slot: m.slot ?? 0,
        teamA: teamMap.get(m.teamAId) ?? null,
        teamB: teamMap.get(m.teamBId) ?? null,
        sets: (m.sets as SetScore[] | null) ?? null,
        winnerTeamId: m.winnerTeamId,
        status: m.status,
        venueId: m.venueId,
        venueName: m.venue?.name ?? null,
        scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
      })),
    };
  }

  async getResult(clubId: string, roundId: string): Promise<RoundResultView[]> {
    await this.ensureRound(clubId, roundId, false);
    const results = await this.prisma.roundResult.findMany({
      where: { roundId },
      orderBy: { finalPosition: 'asc' },
      include: { team: { include: { players: { include: { player: { select: { name: true } } } } } } },
    });
    return results.map((r) => {
      const names = r.team.players.map((p) => p.player.name);
      return {
        teamId: r.teamId,
        label: r.team.label,
        playerNames: [names[0] ?? '?', names[1] ?? '?'],
        finalPosition: r.finalPosition,
        pointsAwarded: r.pointsAwarded,
      };
    });
  }

  // ---- finalização -------------------------------------------------------

  private async finalize(clubId: string, roundId: string): Promise<void> {
    const already = await this.prisma.roundResult.count({ where: { roundId } });
    if (already > 0) return;

    const standings = await this.loadStandings(roundId);
    const bracketSize = planKnockout(standings).qualifierCount;

    const koMatches = await this.prisma.match.findMany({
      where: { phase: 'KNOCKOUT', roundId, winnerTeamId: { not: null } },
      select: { stage: true, teamAId: true, teamBId: true, winnerTeamId: true },
    });
    const knockout: KnockoutOutcome[] = koMatches.map((m) => ({
      stage: m.stage ?? '',
      winnerTeamId: m.winnerTeamId!,
      loserTeamId: m.winnerTeamId === m.teamAId ? m.teamBId : m.teamAId,
    }));

    const placement = computeRoundPlacement({ knockout, groupStandings: standings, bracketSize });

    const config = await this.prisma.championshipConfig.findFirst({
      where: { championship: { rounds: { some: { id: roundId } } } },
      select: { scoringTable: true, participationPoints: true },
    });
    const scoringTable = config
      ? ScoringTableSchema.parse(config.scoringTable)
      : DEFAULT_SCORING_TABLE;
    const participationPoints = config?.participationPoints ?? 0;

    await this.prisma.$transaction(async (tx) => {
      for (const p of placement) {
        await tx.roundResult.create({
          data: {
            roundId,
            teamId: p.teamId,
            finalPosition: p.position,
            pointsAwarded: pointsForPlacement(scoringTable, p.position, participationPoints),
          },
        });
      }
      await tx.round.update({ where: { id: roundId }, data: { status: 'FINISHED' } });
    });
    void clubId;
  }

  // ---- helpers -----------------------------------------------------------

  private async ensureRound(clubId: string, roundId: string, requireActive = true) {
    const round = await this.prisma.round.findFirst({
      where: { id: roundId, championship: { season: { clubId } } },
      select: { id: true, status: true },
    });
    if (!round) {
      throw new NotFoundException({
        error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
      });
    }
    if (requireActive && round.status !== 'IN_PROGRESS' && round.status !== 'DRAWN') {
      throw new ConflictException({
        error: { code: 'KNOCKOUT_NOT_READY', message: 'A rodada não está em andamento' },
      });
    }
    return round;
  }

  private async createStage(roundId: string, stage: string, pairings: Pairing[]): Promise<void> {
    if (pairings.length === 0) return;
    await this.prisma.match.createMany({
      data: pairings.map((p) => ({
        phase: 'KNOCKOUT' as const,
        roundId,
        stage,
        slot: p.slot,
        teamAId: p.teamAId,
        teamBId: p.teamBId,
      })),
    });
  }

  private async loadStandings(roundId: string): Promise<GroupStandings[]> {
    const groups = await this.prisma.group.findMany({
      where: { roundId },
      orderBy: { name: 'asc' },
      include: {
        teams: {
          orderBy: { seed: 'asc' },
          include: {
            team: { include: { players: { include: { player: { select: { name: true } } } } } },
          },
        },
        matches: true,
      },
    });
    return groups.map((g) => {
      const teams: StandingTeam[] = g.teams.map((gt) => {
        const names = gt.team.players.map((p) => p.player.name);
        return {
          teamId: gt.team.id,
          label: gt.team.label,
          playerNames: [names[0] ?? '?', names[1] ?? '?'],
          seed: gt.seed,
        };
      });
      const matches: StandingMatch[] = g.matches.map((m) => ({
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        sets: (m.sets as SetScore[] | null) ?? null,
        winnerTeamId: m.winnerTeamId,
        status: m.status,
      }));
      return { groupName: g.name, standings: computeGroupStandings(matches, teams) };
    });
  }

  private async teamMap(roundId: string): Promise<Map<string, TeamRef>> {
    const teams = await this.prisma.team.findMany({
      where: { roundId },
      include: { players: { include: { player: { select: { name: true } } } } },
    });
    const map = new Map<string, TeamRef>();
    for (const t of teams) {
      const names = t.players.map((p) => p.player.name);
      map.set(t.id, { id: t.id, label: t.label, playerNames: [names[0] ?? '?', names[1] ?? '?'] });
    }
    return map;
  }
}
