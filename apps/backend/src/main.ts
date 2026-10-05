import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Fotos de quadra/capa chegam como data URL (base64) já redimensionada no frontend; o padrão do
  // Express (100kb) rejeitava quase qualquer foto real com 413.
  app.useBodyParser('json', { limit: '10mb' });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://jogae-sports-frontend.vercel.app',
      /\.vercel\.app$/,
    ],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
