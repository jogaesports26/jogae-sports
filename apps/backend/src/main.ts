import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { json } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import {
  resolveCorsOrigins,
  resolveTrustProxy,
  validateEnv,
} from './config/env';

const IMAGE_ROUTES = /^\/(courts|auth\/me)(\/|$)/;

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Atrás de proxy reverso (Caddy/Render) o IP real vem do X-Forwarded-For; o throttler precisa dele.
  app.set('trust proxy', resolveTrustProxy());

  // A API é JSON consumida de outra origem em alguns ambientes: CORP cross-origin evita bloquear o fetch.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Fotos de quadra/capa/logo chegam como data URL (base64) já redimensionada no frontend: só as
  // rotas de quadras e de perfil/tema aceitam corpo grande; o resto fica no padrão de 100kb.
  const largeJson = json({ limit: '10mb' });
  const smallJson = json({ limit: '100kb' });
  app.use((req: Request, res: Response, next: NextFunction) =>
    (IMAGE_ROUTES.test(req.path) ? largeJson : smallJson)(req, res, next),
  );

  app.enableCors({ origin: resolveCorsOrigins() });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
