import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // Cabeçalhos de segurança. CSP desligado para não quebrar o Swagger (/api/docs);
  // CORP em cross-origin para permitir o consumo pela app web (BFF).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Confia no primeiro proxy (deploy) para o rate-limit enxergar o IP real do cliente.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');
  // Validação de entrada é feita com zod (ZodValidationPipe), não com class-validator.
  // WEB_ORIGIN aceita múltiplas origens separadas por vírgula (backoffice + portal).
  const origins = config
    .getOrThrow<string>('WEB_ORIGIN')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ranking Elite Beach API')
    .setDescription('API do sistema de campeonatos de Beach Tennis')
    .setVersion('0.2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  // Em hosts gerenciados (Render/Fly/Railway) a porta chega em PORT; localhost usa API_PORT.
  const port = Number(process.env.PORT) || config.getOrThrow<number>('API_PORT');
  await app.listen(port, '0.0.0.0');
  Logger.log(`API ouvindo na porta ${port} (prefixo /api/v1, docs em /api/docs)`, 'Bootstrap');
}

void bootstrap();
