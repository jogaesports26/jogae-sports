import { Controller, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { HealthController } from './health.controller';

@Controller('limited')
class LimitedController {
  @Post()
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  hit() {
    return { ok: true };
  }
}

describe('Throttler global', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 3 }])],
      controllers: [HealthController, LimitedController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('responde 429 acima do limite da rota', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    await request(server).post('/limited').expect(201);
    await request(server).post('/limited').expect(201);
    await request(server).post('/limited').expect(429);
  });

  it('/health fica fora do limite', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    for (let i = 0; i < 10; i++) {
      await request(server).get('/health').expect(200);
    }
  });
});
