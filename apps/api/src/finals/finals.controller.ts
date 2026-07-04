import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FinalState, JwtPayload } from '@reb/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FinalsService } from './finals.service';

@ApiTags('finals')
@ApiBearerAuth()
@Controller('championships')
@UseGuards(JwtAuthGuard)
export class FinalsController {
  constructor(private readonly finals: FinalsService) {}

  @Post(':id/finals/generate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  generate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ roundId: string }> {
    return this.finals.generate(user.clubId, id);
  }

  @Get(':id/finals')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<FinalState> {
    return this.finals.getFinal(user.clubId, id);
  }
}
