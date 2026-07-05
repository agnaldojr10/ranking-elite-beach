import { Body, Controller, ForbiddenException, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  PushSubscriptionInputSchema,
  type JwtPayload,
  type PushPublicKey,
  type PushSubscriptionInput,
} from '@reb/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PushService } from './push.service';

/** Assinatura de notificações push do atleta (Portal do Jogador). */
@ApiTags('me-push')
@ApiBearerAuth()
@Controller('me/push')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLAYER')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('public-key')
  publicKey(): PushPublicKey {
    return { publicKey: this.push.publicKey() };
  }

  @Post('subscribe')
  @HttpCode(204)
  async subscribe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(PushSubscriptionInputSchema)) dto: PushSubscriptionInput,
  ): Promise<void> {
    await this.push.saveSubscription(user.clubId, this.requireUser(user), dto);
  }

  @Post('unsubscribe')
  @HttpCode(204)
  async unsubscribe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(PushSubscriptionInputSchema)) dto: PushSubscriptionInput,
  ): Promise<void> {
    await this.push.removeSubscription(this.requireUser(user), dto.endpoint);
  }

  private requireUser(user: JwtPayload): string {
    if (!user.playerId) {
      throw new ForbiddenException({
        error: { code: 'NOT_A_PLAYER', message: 'Conta sem vínculo de atleta' },
      });
    }
    return user.sub;
  }
}
