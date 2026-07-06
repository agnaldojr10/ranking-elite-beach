import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChampionshipConfigSchema,
  DEFAULT_CHAMPIONSHIP_CONFIG,
  STRUCTURAL_CONFIG_KEYS,
  type Championship as ChampionshipDto,
  type ChampionshipConfig,
  type ChampionshipStatus,
  type CreateChampionship,
  type UpdateChampionship,
  type UpdateChampionshipConfig,
} from '@reb/contracts';
import { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChampionshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: string, seasonId?: string): Promise<ChampionshipDto[]> {
    const rows = await this.prisma.championship.findMany({
      where: { season: { clubId }, ...(seasonId ? { seasonId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { config: true },
    });
    return rows.map((c) => this.toDto(c));
  }

  async get(clubId: string, id: string): Promise<ChampionshipDto> {
    const row = await this.prisma.championship.findFirst({
      where: { id, season: { clubId } },
      include: { config: true },
    });
    if (!row) throw this.notFound();
    return this.toDto(row);
  }

  async create(clubId: string, dto: CreateChampionship): Promise<ChampionshipDto> {
    const season = await this.prisma.season.findFirst({
      where: { id: dto.seasonId, clubId },
      select: { id: true },
    });
    if (!season) {
      throw new ConflictException({
        error: { code: 'SEASON_INVALID', message: 'Temporada inválida para este clube' },
      });
    }

    const config: ChampionshipConfig = this.mergeConfig(DEFAULT_CHAMPIONSHIP_CONFIG, dto.config);

    const created = await this.prisma.championship.create({
      data: {
        seasonId: dto.seasonId,
        name: dto.name,
        roundsCount: dto.roundsCount,
        qualifiersCount: dto.qualifiersCount,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        config: {
          create: {
            scoringTable: config.scoringTable,
            participationPoints: config.participationPoints,
            tiebreakers: config.tiebreakers,
            drawWeights: config.drawWeights,
            randomness: config.randomness,
            allowRepeatPartners: config.allowRepeatPartners,
            allowRepeatOpponents: config.allowRepeatOpponents,
            finalConfig: config.finalConfig,
          },
        },
      },
      include: { config: true },
    });
    return this.toDto(created);
  }

  async updateConfig(
    clubId: string,
    id: string,
    dto: UpdateChampionshipConfig,
  ): Promise<ChampionshipDto> {
    const champ = await this.prisma.championship.findFirst({
      where: { id, season: { clubId } },
      select: { id: true, status: true },
    });
    if (!champ) throw this.notFound();

    // BR-05: campos estruturais só podem mudar em DRAFT.
    if (champ.status !== 'DRAFT') {
      const touchesStructural = STRUCTURAL_CONFIG_KEYS.some((k) => dto[k] !== undefined);
      if (touchesStructural) {
        throw new ConflictException({
          error: {
            code: 'CONFIG_LOCKED',
            message:
              'Config estrutural (pontuação, desempate, final) não pode mudar após o campeonato ficar ativo',
          },
        });
      }
    }

    const data: Prisma.ChampionshipConfigUpdateInput = {};
    if (dto.scoringTable !== undefined) data.scoringTable = dto.scoringTable;
    if (dto.participationPoints !== undefined) data.participationPoints = dto.participationPoints;
    if (dto.tiebreakers !== undefined) data.tiebreakers = dto.tiebreakers;
    if (dto.drawWeights !== undefined) data.drawWeights = dto.drawWeights;
    if (dto.randomness !== undefined) data.randomness = dto.randomness;
    if (dto.allowRepeatPartners !== undefined) data.allowRepeatPartners = dto.allowRepeatPartners;
    if (dto.allowRepeatOpponents !== undefined) data.allowRepeatOpponents = dto.allowRepeatOpponents;
    if (dto.finalConfig !== undefined) data.finalConfig = dto.finalConfig;

    await this.prisma.championshipConfig.update({ where: { championshipId: id }, data });
    return this.get(clubId, id);
  }

  async updateBasics(
    clubId: string,
    id: string,
    dto: UpdateChampionship,
  ): Promise<ChampionshipDto> {
    const champ = await this.prisma.championship.findFirst({
      where: { id, season: { clubId } },
      select: { id: true, status: true },
    });
    if (!champ) throw this.notFound();

    const changesStructural = dto.roundsCount !== undefined || dto.qualifiersCount !== undefined;
    if (champ.status !== 'DRAFT' && changesStructural) {
      throw new ConflictException({
        error: {
          code: 'CONFIG_LOCKED',
          message: 'Nº de rodadas/classificados não pode mudar após o campeonato ficar ativo',
        },
      });
    }

    await this.prisma.championship.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.roundsCount !== undefined ? { roundsCount: dto.roundsCount } : {}),
        ...(dto.qualifiersCount !== undefined ? { qualifiersCount: dto.qualifiersCount } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
      },
    });
    return this.get(clubId, id);
  }

  async setStatus(
    clubId: string,
    id: string,
    target: ChampionshipStatus,
  ): Promise<ChampionshipDto> {
    const champ = await this.prisma.championship.findFirst({
      where: { id, season: { clubId } },
      select: { id: true, status: true },
    });
    if (!champ) throw this.notFound();

    const allowed: Record<ChampionshipStatus, ChampionshipStatus[]> = {
      DRAFT: ['ACTIVE'],
      ACTIVE: ['FINISHED'],
      FINISHED: [],
    };
    if (!allowed[champ.status].includes(target)) {
      throw new ConflictException({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Transição de ${champ.status} para ${target} não é permitida`,
        },
      });
    }

    await this.prisma.championship.update({ where: { id }, data: { status: target } });
    return this.get(clubId, id);
  }

  private mergeConfig(
    base: ChampionshipConfig,
    partial?: Partial<ChampionshipConfig>,
  ): ChampionshipConfig {
    if (!partial) return base;
    return {
      scoringTable: partial.scoringTable ?? base.scoringTable,
      participationPoints: partial.participationPoints ?? base.participationPoints,
      tiebreakers: partial.tiebreakers ?? base.tiebreakers,
      drawWeights: { ...base.drawWeights, ...(partial.drawWeights ?? {}) },
      randomness: partial.randomness ?? base.randomness,
      allowRepeatPartners: partial.allowRepeatPartners ?? base.allowRepeatPartners,
      allowRepeatOpponents: partial.allowRepeatOpponents ?? base.allowRepeatOpponents,
      finalConfig: { ...base.finalConfig, ...(partial.finalConfig ?? {}) },
    };
  }

  private toDto(row: {
    id: string;
    seasonId: string;
    name: string;
    roundsCount: number;
    qualifiersCount: number;
    status: ChampionshipStatus;
    startDate: Date | null;
    createdAt: Date;
    config: {
      scoringTable: Prisma.JsonValue;
      participationPoints: number;
      tiebreakers: Prisma.JsonValue;
      drawWeights: Prisma.JsonValue;
      randomness: number;
      allowRepeatPartners: boolean;
      allowRepeatOpponents: boolean;
      finalConfig: Prisma.JsonValue;
    } | null;
  }): ChampionshipDto {
    const config = row.config
      ? ChampionshipConfigSchema.parse({
          scoringTable: row.config.scoringTable,
          participationPoints: row.config.participationPoints,
          tiebreakers: row.config.tiebreakers,
          drawWeights: row.config.drawWeights,
          randomness: row.config.randomness,
          allowRepeatPartners: row.config.allowRepeatPartners,
          allowRepeatOpponents: row.config.allowRepeatOpponents,
          finalConfig: row.config.finalConfig,
        })
      : DEFAULT_CHAMPIONSHIP_CONFIG;

    return {
      id: row.id,
      seasonId: row.seasonId,
      name: row.name,
      roundsCount: row.roundsCount,
      qualifiersCount: row.qualifiersCount,
      status: row.status,
      startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
      createdAt: row.createdAt.toISOString(),
      config,
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      error: { code: 'CHAMPIONSHIP_NOT_FOUND', message: 'Campeonato não encontrado' },
    });
  }
}
