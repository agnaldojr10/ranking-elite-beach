import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  // Validação de entrada é feita com zod (ZodValidationPipe), não com class-validator.
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ranking Elite Beach API')
    .setDescription('API do sistema de campeonatos de Beach Tennis')
    .setVersion('0.2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.getOrThrow<number>('API_PORT');
  await app.listen(port);
  Logger.log(`API em http://localhost:${port}/api/v1 (docs em /api/docs)`, 'Bootstrap');
}

void bootstrap();
