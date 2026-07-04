import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateVenueSchema,
  UpdateVenueSchema,
  type CreateVenue,
  type JwtPayload,
  type UpdateVenue,
  type Venue,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { VenuesService } from './venues.service';

@ApiTags('venues')
@ApiBearerAuth()
@Controller('venues')
@UseGuards(JwtAuthGuard)
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<Venue[]> {
    return this.venues.list(user.clubId);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Venue> {
    return this.venues.get(user.clubId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateVenueSchema)) dto: CreateVenue,
  ): Promise<Venue> {
    return this.venues.create(user.clubId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVenueSchema)) dto: UpdateVenue,
  ): Promise<Venue> {
    return this.venues.update(user.clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<{ ok: true }> {
    return this.venues.remove(user.clubId, id);
  }
}
