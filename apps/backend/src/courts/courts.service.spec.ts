import { NotFoundException } from '@nestjs/common';
import { CourtsService } from './courts.service';

function buildPrismaMock() {
  return {
    court: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    priceRule: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn({} as any)),
  };
}

describe('CourtsService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: CourtsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new CourtsService(prisma as any);
  });

  it('cria uma quadra vinculada ao dono autenticado', async () => {
    prisma.court.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'court-1', ...data }),
    );

    const result = await service.create('owner-1', {
      name: 'Quadra Teste',
      sport: 'SOCIETY',
      surfaceType: 'GRAMA_SINTETICA',
    });

    expect(prisma.court.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: 'owner-1' }),
      }),
    );
    expect(result.ownerId).toBe('owner-1');
  });

  it('lança NotFound ao tentar editar uma quadra de outro dono', async () => {
    prisma.court.findFirst.mockResolvedValue(null);

    await expect(
      service.update('court-1', 'outro-dono', { name: 'Hack' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('faz soft-delete (active=false) em vez de apagar a quadra', async () => {
    prisma.court.findFirst.mockResolvedValue({
      id: 'court-1',
      ownerId: 'owner-1',
    });
    prisma.court.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'court-1', ...data }),
    );

    const result = await service.remove('court-1', 'owner-1');

    expect(prisma.court.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { active: false } }),
    );
    expect(result.active).toBe(false);
  });

  it('rejeita regra de preço com horário final antes do inicial', async () => {
    prisma.court.findFirst.mockResolvedValue({
      id: 'court-1',
      ownerId: 'owner-1',
      priceRules: [],
    });

    await expect(
      service.replacePriceRules('court-1', 'owner-1', {
        rules: [
          { dayOfWeek: 1, startMinute: 600, endMinute: 500, pricePerHour: 50 },
        ],
      } as any),
    ).rejects.toThrow('depois do horário inicial');
  });
});
