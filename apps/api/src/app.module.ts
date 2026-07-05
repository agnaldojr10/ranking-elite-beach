import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlayersModule } from './players/players.module';
import { SeasonsModule } from './seasons/seasons.module';
import { ChampionshipsModule } from './championships/championships.module';
import { RoundsModule } from './rounds/rounds.module';
import { RankingModule } from './ranking/ranking.module';
import { StatsModule } from './stats/stats.module';
import { VenuesModule } from './venues/venues.module';
import { CalendarModule } from './calendar/calendar.module';
import { FinalsModule } from './finals/finals.module';
import { MeModule } from './me/me.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Lê o .env da raiz do monorepo (e um .env local, se houver).
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            // ttl em milissegundos (throttler v6).
            ttl: config.getOrThrow<number>('THROTTLE_TTL') * 1000,
            limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PlayersModule,
    SeasonsModule,
    ChampionshipsModule,
    RoundsModule,
    RankingModule,
    StatsModule,
    VenuesModule,
    CalendarModule,
    FinalsModule,
    MeModule,
  ],
  controllers: [HealthController],
  providers: [
    // Rate-limit global por IP.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Padroniza o formato de erro de toda a API.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
