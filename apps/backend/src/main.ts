import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import {
  resolveCorsOrigins,
  resolveTrustProxy,
  validateEnv,
} from './config/env';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Atrás de proxy reverso (Caddy/Render) o IP real vem do X-Forwarded-For; o throttler precisa dele.
  app.set('trust proxy', resolveTrustProxy());

  // A API é JSON consumida de outra origem em alguns ambientes: CORP cross-origin evita bloquear o fetch.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Fotos de quadra/capa chegam como data URL (base64) já redimensionada no frontend; o padrão do
  // Express (100kb) rejeitava quase qualquer foto real com 413.
  app.useBodyParser('json', { limit: '10mb' });

  app.enableCors({ origin: resolveCorsOrigins() });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
