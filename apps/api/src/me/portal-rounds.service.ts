import { Injectable } from '@nestjs/common';
import {
  buildDrawReport,
  buildRoundReport,
  roundLabel,
  type Player,
  type QuickAddPlayer,
  type Round,
  type RoundReport,
  type SkillLevel,
} from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from '../players/players.service';
import { RankingService } from '../ranking/ranking.service';
import { KnockoutService } from '../rounds/knockout.service';
import { MatchesService } from '../rounds/matches.service';
import { RegistrationsService } from '../rounds/registrations.service';
import { RoundsService } from '../rounds/rounds.service';

/**
 * Suporte ao Portal do Jogador para OPERAR a rodada (qualquer atleta do clube):
 * lista as rodadas do campeonato ativo e monta o relatório de texto (WhatsApp).
 * O sorteio/placar/mata-mata em si reusam os serviços do backoffice.
 */
@Injectable()
export class PortalRoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rounds: RoundsService,
    private readonly knockout: KnockoutService,
    private readonly ranking: RankingService,
    private readonly matches: MatchesService,
    private readonly players: PlayersService,
    private readonly registrations: RegistrationsService,
  ) {}

  /**
   * Cadastro rápido na operação da rodada: cria o atleta (dados padrão, dá para
   * completar depois) e já o inscreve como CONFIRMADO na rodada. Escopado ao clube.
   */
  async quickAddPlayer(clubId: string, roundId: string, dto: QuickAddPlayer): Promise<Player> {
    await this.rounds.get(clubId, roundId); // valida rodada do clube
    const player = await this.players.create(clubId, {
      name: dto.name,
      birthDate: '2000-01-01', // placeholder; a organização completa depois
      photoUrl: '',
      phone: '',
      skillLevel: 'INTERMEDIATE',
      status: 'ACTIVE',
      type: dto.type,
    });
    await this.registrations.create(clubId, roundId, { playerId: player.id, status: 'CONFIRMED' });
    return player;
  }

  /** Texto do sorteio (grupos + duplas) para enviar no WhatsApp após sortear. */
  async drawReport(clubId: string, roundId: string): Promise<RoundReport> {
    const round = await this.rounds.get(clubId, roundId);
    const standings = await this.matches.getStandings(clubId, roundId);
    const groups = standings.map((g) => ({
      name: g.groupName,
      pairs: g.standings.map((s) => s.playerNames),
    }));
    const text = buildDrawReport({
      championshipName: round.championshipName,
      roundLabel: roundLabel(round),
      date: round.date,
      groups,
    });
    return { text };
  }

  /** Rodadas do campeonato ATIVO do clube (o "dia" que o atleta vai operar). */
  async listRounds(clubId: string): Promise<Round[]> {
    const champ = await this.activeChampionship(clubId);
    if (!champ) return [];
    return this.rounds.list(clubId, champ.id);
  }

  /** Atletas ATIVOS do clube ainda não inscritos na rodada (p/ marcar presentes). */
  async eligiblePlayers(
    clubId: string,
    roundId: string,
  ): Promise<{ id: string; name: string; skillLevel: SkillLevel }[]> {
    const round = await this.rounds.get(clubId, roundId); // valida escopo do clube
    const registered = new Set((round.registrations ?? []).map((r) => r.player.id));
    const players = await this.prisma.player.findMany({
      where: { clubId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, skillLevel: true },
    });
    return players
      .filter((p) => !registered.has(p.id))
      .map((p) => ({ id: p.id, name: p.name, skillLevel: p.skillLevel as SkillLevel }));
  }

  /** Relatório de texto da rodada: colocação + ranking atualizado do campeonato. */
  async report(clubId: string, roundId: string): Promise<RoundReport> {
    const round = await this.rounds.get(clubId, roundId);
    const championshipId = round.championshipId;

    const [results, ranking] = await Promise.all([
      this.knockout.getResult(clubId, roundId),
      this.ranking.getRanking(clubId, championshipId, 'CHAMPIONSHIP'),
    ]);

    const text = buildRoundReport({
      championshipName: round.championshipName,
      roundLabel: roundLabel(round),
      date: round.date,
      results: results.map((r) => ({
        playerNames: r.playerNames,
        finalPosition: r.finalPosition,
        pointsAwarded: r.pointsAwarded,
      })),
      ranking: ranking.entries.map((e) => ({ playerName: e.playerName, points: e.points })),
      // Relatório do WhatsApp lista o ranking COMPLETO do campeonato.
      rankingLimit: ranking.entries.length,
    });

    return { text };
  }

  private async activeChampionship(clubId: string): Promise<{ id: string } | null> {
    const active = await this.prisma.championship.findFirst({
      where: { season: { clubId }, status: 'ACTIVE' },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    if (active) return active;
    // Sem campeonato ativo: cai para o mais recente do clube (evita tela vazia).
    return this.prisma.championship.findFirst({
      where: { season: { clubId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
  }
}
