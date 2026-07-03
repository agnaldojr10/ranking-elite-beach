import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateSeason, Season as SeasonDto, SeasonStatus } from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: string): Promise<SeasonDto[]> {
    const rows = await this.prisma.season.findMany({
      where: { clubId },
      orderBy: { year: 'desc' },
      include: { _count: { select: { championships: true } } },
    });
    return rows.map((s) => ({
      id: s.id,
      clubId: s.clubId,
      year: s.year,
      name: s.name,
      status: s.status,
      championshipsCount: s._count.championships,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async create(clubId: string, dto: CreateSeason): Promise<SeasonDto> {
    const exists = await this.prisma.season.findFirst({
      where: { clubId, year: dto.year },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException({
        error: { code: 'SEASON_EXISTS', message: `Já existe temporada para o ano ${dto.year}` },
      });
    }
    const s = await this.prisma.season.create({
      data: { clubId, year: dto.year, name: dto.name },
    });
    return {
      id: s.id,
      clubId: s.clubId,
      year: s.year,
      name: s.name,
      status: s.status,
      championshipsCount: 0,
      createdAt: s.createdAt.toISOString(),
    };
  }

  async setStatus(clubId: string, id: string, status: SeasonStatus): Promise<SeasonDto> {
    const season = await this.prisma.season.findFirst({ where: { id, clubId }, select: { id: true } });
    if (!season) {
      throw new NotFoundException({
        error: { code: 'SEASON_NOT_FOUND', message: 'Temporada não encontrada' },
      });
    }
    const s = await this.prisma.season.update({ where: { id }, data: { status } });
    return {
      id: s.id,
      clubId: s.clubId,
      year: s.year,
      name: s.name,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
