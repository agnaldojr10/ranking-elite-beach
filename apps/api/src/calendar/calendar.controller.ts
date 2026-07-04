import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CalendarQuerySchema,
  CreateCalendarEventSchema,
  type CalendarItem,
  type CreateCalendarEvent,
  type JwtPayload,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(CalendarQuerySchema)) query: { from: string; to: string },
  ): Promise<CalendarItem[]> {
    return this.calendar.getCalendar(user.clubId, query.from, query.to);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateCalendarEventSchema)) dto: CreateCalendarEvent,
  ): Promise<CalendarItem> {
    return this.calendar.createEvent(user.clubId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<{ ok: true }> {
    return this.calendar.removeEvent(user.clubId, id);
  }
}
