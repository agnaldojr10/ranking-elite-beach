import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  DEFAULT_DRAW_WEIGHTS,
  DrawWeightsSchema,
  SKILL_STRENGTH,
  computeRoundReadiness,
  type ConfirmDraw,
  type ConfirmedDraw,
  type DrawConfig,
  type DrawPlayerInput,
  type DrawResult,
  type SimulateDraw,
} from '@reb/contracts';
import { runDraw, DrawError } from '@reb/sort-engine';
import type { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  HistoryService,
  opponentPairsFromMatches,
  partnerPairsFromTeams,
} from './history.service';

type RoundWithData = Prisma.RoundGetPayload<{
  include: {
    championship: { include: { config: true } };
    registrations: { include: { player: { select: { id: true; name: true; skillLevel: true } } } };
  };
}>;

@Injectable()
export class DrawService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly history: HistoryService,
  ) {}

  async simulate(clubId: string, roundId: string, dto: SimulateDraw): Promise<DrawResult> {
    const round = await this.loadRound(clubId, roundId);
    this.assertReadiness(round.registrations.length);

    const { config, players } = this.buildEngineInput(round, dto);
    const seed = dto.seed ?? randomBytes(4).toString('hex');
    const { partner, opponent } = await this.historyFor(round.kind, clubId);

    return this.execute(players, partner, opponent, config, seed);
  }

  async confirm(
    clubId: string,
    roundId: string,
    userId: string,
    dto: ConfirmDraw,
  ): Promise<ConfirmedDraw> {
    const round = await this.loadRound(clubId, roundId);
    this.assertReadiness(round.registrations.length);

    const existing = await this.prisma.draw.findUnique({ where: { roundId } });
    if (existing) {
      throw new ConflictException({
        error: {
          code: 'DRAW_EXISTS',
          message: 'Esta rodada já tem um sorteio confirmado. Descarte-o antes de sortear de novo.',
        },
      });
    }

    const { config, players } = this.buildEngineInput(round, dto);
    const { partner, opponent } = await this.historyFor(round.kind, clubId);
    const result = this.execute(players, partner, opponent, config, dto.seed);
    const isFinal = round.kind === 'FINAL_PHASE';

    await this.prisma.$transaction(async (tx) => {
      const draw = await tx.draw.create({
        data: {
          roundId,
          seed: result.seed,
          configSnapshot: config as unknown as Prisma.InputJsonValue,
          qualityScore: result.qualityScore,
          metrics: result.metrics as unknown as Prisma.InputJsonValue,
          explanations: result.explanations,
          createdById: userId,
        },
      });

      // Duplas (Team + TeamPlayer), mapeando o id lógico "t1" → id do banco.
      const teamDbId = new Map<string, string>();
      for (const t of result.teams) {
        const team = await tx.team.create({
          data: {
            roundId,
            drawId: draw.id,
            label: t.label,
            strength: t.strength,
            players: { create: [{ playerId: t.players[0] }, { playerId: t.players[1] }] },
          },
        });
        teamDbId.set(t.id, team.id);
      }

      // Grupos + alocação.
      const groupDbId = new Map<string, string>();
      for (const g of result.groups) {
        const group = await tx.group.create({ data: { roundId, drawId: draw.id, name: g.name } });
        groupDbId.set(g.name, group.id);
        await tx.groupTeam.createMany({
          data: g.teamIds.map((tid, seed) => ({
            groupId: group.id,
            teamId: teamDbId.get(tid)!,
            seed,
          })),
        });
      }

      // Confrontos.
      await tx.match.createMany({
        data: result.matches.map((m) => ({
          groupId: groupDbId.get(m.groupName)!,
          teamAId: teamDbId.get(m.teamAId)!,
          teamBId: teamDbId.get(m.teamBId)!,
        })),
      });

      await tx.round.update({ where: { id: roundId }, data: { status: 'DRAWN' } });

      // Histórico (+1) — a fase final não alimenta o histórico da temporada (BR-34).
      if (!isFinal) {
        const teamPlayers = new Map(result.teams.map((t) => [t.id, t.players]));
        await this.history.applyDrawDeltas(
          tx,
          clubId,
          roundId,
          partnerPairsFromTeams(result.teams),
          opponentPairsFromMatches(result.matches, teamPlayers),
          1,
        );
      }
    });

    return this.getConfirmed(clubId, roundId);
  }

  async getConfirmed(clubId: string, roundId: string): Promise<ConfirmedDraw> {
    const draw = await this.prisma.draw.findFirst({
      where: { roundId, round: { championship: { season: { clubId } } } },
      include: {
        teams: { include: { players: { include: { player: { select: { name: true } } } } } },
        groups: {
          include: {
            teams: true,
            matches: true,
          },
        },
      },
    });
    if (!draw) {
      throw new NotFoundException({
        error: { code: 'DRAW_NOT_FOUND', message: 'Rodada ainda não tem sorteio confirmado' },
      });
    }

    const teams = draw.teams.map((t) => {
      const ps = t.players.map((tp) => tp.playerId) as [string, string];
      const names = t.players.map((tp) => tp.player.name) as [string, string];
      return { id: t.id, label: t.label, players: ps, playerNames: names, strength: t.strength };
    });

    const groups = draw.groups.map((g) => ({
      name: g.name,
      teamIds: g.teams.map((gt) => gt.teamId),
    }));

    const matches = draw.groups.flatMap((g) =>
      g.matches.map((m) => ({
        id: m.id,
        groupName: g.name,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        status: m.status,
      })),
    );

    return {
      id: draw.id,
      roundId: draw.roundId,
      seed: draw.seed,
      qualityScore: draw.qualityScore,
      metrics: draw.metrics as ConfirmedDraw['metrics'],
      explanations: draw.explanations as string[],
      teams,
      groups,
      matches,
      createdAt: draw.createdAt.toISOString(),
    };
  }

  async discard(clubId: string, roundId: string): Promise<{ ok: true }> {
    const draw = await this.prisma.draw.findFirst({
      where: { roundId, round: { championship: { season: { clubId } } } },
      include: {
        round: { select: { kind: true } },
        teams: { include: { players: true } },
        groups: { include: { matches: true } },
      },
    });
    if (!draw) {
      throw new NotFoundException({
        error: { code: 'DRAW_NOT_FOUND', message: 'Rodada ainda não tem sorteio confirmado' },
      });
    }

    // Não descartar após resultados lançados (apagaria os jogos/resultados).
    const hasResults = draw.groups.some((g) => g.matches.some((m) => m.status !== 'PENDING'));
    if (hasResults) {
      throw new ConflictException({
        error: {
          code: 'DRAW_HAS_RESULTS',
          message:
            'Não é possível descartar o sorteio: já há resultados lançados nesta rodada.',
        },
      });
    }

    // Reconstrói os pares para reverter o histórico.
    const teamPlayers = new Map<string, [string, string]>(
      draw.teams.map((t) => [t.id, t.players.map((p) => p.playerId) as [string, string]]),
    );
    const partnerPairs = [...teamPlayers.values()];
    const matches = draw.groups.flatMap((g) => g.matches);

    await this.prisma.$transaction(async (tx) => {
      // Fase final não mexeu no histórico, então não há o que reverter.
      if (draw.round.kind !== 'FINAL_PHASE') {
        await this.history.applyDrawDeltas(
          tx,
          clubId,
          roundId,
          partnerPairs,
          opponentPairsFromMatches(matches, teamPlayers),
          -1,
        );
      }
      // Draw em cascade remove Team/Group/Match/GroupTeam/TeamPlayer.
      await tx.draw.delete({ where: { id: draw.id } });
      await tx.round.update({ where: { id: roundId }, data: { status: 'OPEN' } });
    });

    return { ok: true };
  }

  // ---- helpers -----------------------------------------------------------

  private async loadRound(clubId: string, roundId: string): Promise<RoundWithData> {
    const round = await this.prisma.round.findFirst({
      where: { id: roundId, championship: { season: { clubId } } },
      include: {
        championship: { include: { config: true } },
        registrations: {
          where: { status: 'CONFIRMED' },
          include: { player: { select: { id: true, name: true, skillLevel: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!round) {
      throw new NotFoundException({
        error: { code: 'ROUND_NOT_FOUND', message: 'Rodada não encontrada' },
      });
    }
    return round;
  }

  /** Histórico real para rodadas regulares; vazio para a fase final (BR-34). */
  private async historyFor(
    kind: string,
    clubId: string,
  ): Promise<{ partner: Map<string, number>; opponent: Map<string, number> }> {
    if (kind === 'FINAL_PHASE') return { partner: new Map(), opponent: new Map() };
    return this.history.loadHistory(clubId);
  }

  private assertReadiness(confirmed: number): void {
    const readiness = computeRoundReadiness(confirmed);
    if (readiness.canDraw) return;
    if (readiness.code === 'ODD_PLAYER_COUNT') {
      throw new ConflictException({ error: { code: 'ODD_PLAYER_COUNT', message: readiness.message } });
    }
    throw new UnprocessableEntityException({
      error: { code: 'PLAYER_COUNT_OUT_OF_RANGE', message: readiness.message },
    });
  }

  private buildEngineInput(
    round: RoundWithData,
    dto: SimulateDraw,
  ): { config: DrawConfig; players: DrawPlayerInput[] } {
    const cfg = round.championship.config;
    const baseWeights = cfg ? DrawWeightsSchema.parse(cfg.drawWeights) : DEFAULT_DRAW_WEIGHTS;
    const isFinal = round.kind === 'FINAL_PHASE';
    const weights = { ...baseWeights, ...(dto.weights ?? {}) };
    const config: DrawConfig = {
      // Fase final ignora histórico de parceiros: peso 0 e repetição liberada (BR-34).
      weights: isFinal ? { ...weights, partner: 0 } : weights,
      randomness: dto.randomness ?? cfg?.randomness ?? 50,
      allowRepeatPartners: isFinal ? true : (dto.allowRepeatPartners ?? cfg?.allowRepeatPartners ?? false),
      allowRepeatOpponents: dto.allowRepeatOpponents ?? cfg?.allowRepeatOpponents ?? true,
      groupSizePreference: dto.groupSizePreference ?? round.groupSizePref,
    };
    const players: DrawPlayerInput[] = round.registrations.map((r) => ({
      id: r.player.id,
      name: r.player.name,
      strength: SKILL_STRENGTH[r.player.skillLevel],
      skillLevel: r.player.skillLevel,
    }));
    return { config, players };
  }

  private execute(
    players: DrawPlayerInput[],
    partner: Map<string, number>,
    opponent: Map<string, number>,
    config: DrawConfig,
    seed: string,
  ): DrawResult {
    try {
      return runDraw({ players, partnerHistory: partner, opponentHistory: opponent, config, seed });
    } catch (e) {
      if (e instanceof DrawError) {
        if (e.code === 'ODD_PLAYER_COUNT') {
          throw new ConflictException({ error: { code: e.code, message: e.message } });
        }
        throw new UnprocessableEntityException({ error: { code: e.code, message: e.message } });
      }
      throw e;
    }
  }
}