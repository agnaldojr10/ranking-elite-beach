import { Body, Controller, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UpdateRegistrationSchema,
  type JwtPayload,
  type Registration,
  type UpdateRegistration,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RegistrationsService } from './registrations.service';

@ApiTags('rounds')
@ApiBearerAuth()
@Controller('registrations')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRegistrationSchema)) dto: UpdateRegistration,
  ): Promise<Registration> {
    return this.registrations.update(user.clubId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.registrations.remove(user.clubId, id);
  }
}
