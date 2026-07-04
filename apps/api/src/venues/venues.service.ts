import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AvailabilitySlotSchema,
  type CreateVenue,
  type UpdateVenue,
  type Venue as VenueDto,
} from '@reb/contracts';
import { Prisma } from '@reb/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clubId: string): Promise<VenueDto[]> {
    const rows = await this.prisma.venue.findMany({
      where: { clubId },
      orderBy: [{ number: 'asc' }, { name: 'asc' }],
    });
    return rows.map((v) => this.toDto(v));
  }

  async get(clubId: string, id: string): Promise<VenueDto> {
    const v = await this.prisma.venue.findFirst({ where: { id, clubId } });
    if (!v) throw this.notFound();
    return this.toDto(v);
  }

  async create(clubId: string, dto: CreateVenue): Promise<VenueDto> {
    const v = await this.prisma.venue.create({
      data: {
        clubId,
        name: dto.name,
        number: dto.number ?? null,
        location: dto.location ? dto.location : null,
        availability: (dto.availability ?? []) as unknown as Prisma.InputJsonValue,
      },
    });
    return this.toDto(v);
  }

  async update(clubId: string, id: string, dto: UpdateVenue): Promise<VenueDto> {
    await this.ensureExists(clubId, id);
    const v = await this.prisma.venue.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.number !== undefined ? { number: dto.number ?? null } : {}),
        ...(dto.location !== undefined ? { location: dto.location ? dto.location : null } : {}),
        ...(dto.availability !== undefined
          ? { availability: dto.availability as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
    return this.toDto(v);
  }

  async remove(clubId: string, id: string): Promise<{ ok: true }> {
    await this.ensureExists(clubId, id);
    await this.prisma.venue.delete({ where: { id } }); // Match.venueId → SetNull
    return { ok: true };
  }

  private async ensureExists(clubId: string, id: string): Promise<void> {
    const v = await this.prisma.venue.findFirst({ where: { id, clubId }, select: { id: true } });
    if (!v) throw this.notFound();
  }

  private toDto(v: {
    id: string;
    name: string;
    number: number | null;
    location: string | null;
    availability: Prisma.JsonValue;
    createdAt: Date;
  }): VenueDto {
    const availability = Array.isArray(v.availability)
      ? v.availability.map((s) => AvailabilitySlotSchema.parse(s))
      : [];
    return {
      id: v.id,
      name: v.name,
      number: v.number,
      location: v.location,
      availability,
      createdAt: v.createdAt.toISOString(),
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      error: { code: 'VENUE_NOT_FOUND', message: 'Quadra não encontrada' },
    });
  }
}
