import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlayersModule } from './players/players.module';
import { SeasonsModule } from './seasons/seasons.module';
import { ChampionshipsModule } from './championships/championships.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Lê o .env da raiz do monorepo (e um .env local, se houver).
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PlayersModule,
    SeasonsModule,
    ChampionshipsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
