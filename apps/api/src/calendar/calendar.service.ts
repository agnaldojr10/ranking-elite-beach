import { Injectable, NotFoundException } from '@nestjs/common';
import type { CalendarItem, CreateCalendarEvent } from '@reb/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(clubId: string, from: string, to: string): Promise<CalendarItem[]> {
    const gte = new Date(from);
    const lte = new Date(to);

    const [rounds, events] = await Promise.all([
      this.prisma.round.findMany({
        where: {
          date: { gte, lte },
          championship: { season: { clubId } },
        },
        select: {
          id: true,
          number: true,
          date: true,
          kind: true,
          championship: { select: { name: true } },
        },
      }),
      this.prisma.calendarEvent.findMany({
        where: { clubId, date: { gte, lte } },
      }),
    ]);

    const items: CalendarItem[] = [];
    for (const r of rounds) {
      if (!r.date) continue;
      items.push({
        id: `round:${r.id}`,
        type: r.kind === 'FINAL_PHASE' ? 'FINAL' : 'ROUND',
        title: `${r.championship.name} · Rodada ${r.number}`,
        date: r.date.toISOString().slice(0, 10),
        refId: r.id,
        manual: false,
      });
    }
    for (const e of events) {
      items.push({
        id: e.id,
        type: e.type,
        title: e.title,
        date: e.date.toISOString().slice(0, 10),
        refId: e.refId,
        manual: true,
      });
    }

    items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return items;
  }

  async createEvent(clubId: string, dto: CreateCalendarEvent): Promise<CalendarItem> {
    const e = await this.prisma.calendarEvent.create({
      data: { clubId, type: dto.type, title: dto.title, date: new Date(dto.date) },
    });
    return {
      id: e.id,
      type: e.type,
      title: e.title,
      date: e.date.toISOString().slice(0, 10),
      refId: e.refId,
      manual: true,
    };
  }

  async removeEvent(clubId: string, id: string): Promise<{ ok: true }> {
    const e = await this.prisma.calendarEvent.findFirst({ where: { id, clubId }, select: { id: true } });
    if (!e) {
      throw new NotFoundException({
        error: { code: 'EVENT_NOT_FOUND', message: 'Evento não encontrado' },
      });
    }
    await this.prisma.calendarEvent.delete({ where: { id } });
    return { ok: true };
  }
}
