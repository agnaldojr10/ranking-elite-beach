import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PushSubscriptionInput } from '@reb/contracts';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

/** Conteúdo de uma notificação enviada ao dispositivo do atleta. */
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger('Push');
  private readonly _enabled: boolean;
  private readonly _publicKey: string | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    const subject = config.getOrThrow<string>('VAPID_SUBJECT');
    this._enabled = Boolean(publicKey && privateKey);
    this._publicKey = publicKey ?? null;
    if (this._enabled) {
      webpush.setVapidDetails(subject, publicKey!, privateKey!);
    } else {
      this.logger.warn('Web Push desativado (defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY).');
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  publicKey(): string | null {
    return this._publicKey;
  }

  /** Salva/atualiza a assinatura do dispositivo (idempotente por endpoint). */
  async saveSubscription(clubId: string, userId: string, dto: PushSubscriptionInput): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: { clubId, userId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
      update: { userId, clubId, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
    });
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }

  /** Envia uma notificação a todos os dispositivos dos jogadores informados. */
  async notifyPlayers(playerIds: string[], payload: PushPayload): Promise<void> {
    if (!this._enabled || playerIds.length === 0) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { user: { playerId: { in: playerIds } } },
    });
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          // Assinatura expirada/removida: limpa do banco.
          if (status === 404 || status === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          } else {
            this.logger.warn(`Falha ao enviar push (${status ?? 'erro'})`);
          }
        }
      }),
    );
  }
}
