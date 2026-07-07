import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateStaffUserSchema,
  UpdateStaffUserSchema,
  type CreateStaffUser,
  type JwtPayload,
  type StaffUser,
  type UpdateStaffUser,
} from '@reb/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

/** Gestão de equipe da organização — exclusivo de ADMIN. */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<StaffUser[]> {
    return this.users.listStaff(user.clubId);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateStaffUserSchema)) dto: CreateStaffUser,
  ): Promise<StaffUser> {
    return this.users.createStaff(user.clubId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStaffUserSchema)) dto: UpdateStaffUser,
  ): Promise<StaffUser> {
    return this.users.updateStaff(user.clubId, id, user.sub, dto);
  }
}
