import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';

function buildPrismaMock() {
  return {
    priceRule: { findMany: jest.fn() },
    reservation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    maintenanceBlock: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    court: { findFirst: jest.fn() },
    player: { findUnique: jest.fn() },
  };
}

function buildCourtsServiceMock(
  court: { id: string; ownerId: string } | null = {
    id: 'court-1',
    ownerId: 'owner-1',
  },
) {
  return {
    findOneOrThrow: jest
      .fn()
      .mockImplementation((courtId: string, ownerId: string) => {
        if (!court || court.id !== courtId || court.ownerId !== ownerId) {
          throw new NotFoundException('Quadra não encontrada');
        }
        return Promise.resolve(court);
      }),
  };
}

// Saturday 2026-09-12 in local time, 14:00-16:00 across two contiguous 1h price rules.
const SATURDAY_RULES = [
  {
    id: 'r1',
    courtId: 'court-1',
    dayOfWeek: 6,
    startMinute: 840,
    endMinute: 900,
    pricePerHour: 80,
  },
  {
    id: 'r2',
    courtId: 'court-1',
    dayOfWeek: 6,
    startMinute: 900,
    endMinute: 960,
    pricePerHour: 100,
  },
];

describe('ReservationsService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let courtsService: ReturnType<typeof buildCourtsServiceMock>;
  let service: ReservationsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    courtsService = buildCourtsServiceMock();
    const reviewsService = {
      getSummary: jest
        .fn()
        .mockResolvedValue({ averageRating: null, reviewCount: 0 }),
      getSummaryForCourts: jest.fn(),
    };
    service = new ReservationsService(
      prisma as any,
      courtsService as any,
      reviewsService as any,
    );
  });

  describe('calculatePrice (private, exercised via create)', () => {
    it('somma o preço de múltiplas faixas contíguas de preço', async () => {
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const startsAt = new Date('2026-09-12T14:00:00');
      const endsAt = new Date('2026-09-12T16:00:00');

      const result = await service.create('court-1', 'owner-1', {
        guestName: 'Cliente Teste',
        guestPhone: '85999998888',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });

      expect(result.priceSnapshot).toBe(180);
    });

    it('rejeita quando o horário final não coincide com o fim de uma faixa de preço', async () => {
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);

      const startsAt = new Date('2026-09-12T14:00:00');
      const endsAt = new Date('2026-09-12T14:30:00');

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando existe um buraco entre as faixas de preço', async () => {
      prisma.priceRule.findMany.mockResolvedValue([SATURDAY_RULES[0]]);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);

      const startsAt = new Date('2026-09-12T14:00:00');
      const endsAt = new Date('2026-09-12T16:00:00');

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('conflitos de horário', () => {
    it('rejeita reserva sobreposta a outra reserva confirmada', async () => {
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: new Date('2026-09-12T14:00:00').toISOString(),
          endsAt: new Date('2026-09-12T15:00:00').toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita reserva sobreposta a um bloqueio de manutenção', async () => {
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue({ id: 'block-1' });

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: new Date('2026-09-12T14:00:00').toISOString(),
          endsAt: new Date('2026-09-12T15:00:00').toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('isolamento por dono', () => {
    it('rejeita operar numa quadra que não pertence ao dono autenticado', async () => {
      await expect(
        service.create('court-1', 'outro-dono', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: new Date('2026-09-12T14:00:00').toISOString(),
          endsAt: new Date('2026-09-12T15:00:00').toISOString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createForPlayer', () => {
    beforeEach(() => {
      prisma.court.findFirst.mockResolvedValue({
        id: 'court-1',
        name: 'Quadra 1',
        sport: 'FUTSAL',
        surfaceType: 'QUADRA_POLIESPORTIVA',
        hasLighting: true,
        photoUrls: [],
        owner: {},
      });
    });

    it('cria a reserva quando o jogador do token ainda existe', async () => {
      prisma.player.findUnique.mockResolvedValue({ id: 'player-1' });
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const result = await service.createForPlayer(
        'court-1',
        'player-1',
        new Date('2026-09-12T14:00:00').toISOString(),
        new Date('2026-09-12T16:00:00').toISOString(),
      );

      expect(result.priceSnapshot).toBe(180);
    });

    it('rejeita com 401 quando o jogador do token não existe mais (sessão obsoleta)', async () => {
      prisma.player.findUnique.mockResolvedValue(null);

      await expect(
        service.createForPlayer(
          'court-1',
          'player-fantasma',
          new Date('2026-09-12T14:00:00').toISOString(),
          new Date('2026-09-12T16:00:00').toISOString(),
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelamento', () => {
    it('rejeita cancelamento a menos de 2 horas do horário reservado', async () => {
      const startsAt = new Date(Date.now() + 30 * 60 * 1000);
      prisma.reservation.findFirst.mockResolvedValue({
        id: 'res-1',
        courtId: 'court-1',
        status: 'CONFIRMED',
        startsAt,
      });

      await expect(
        service.cancel('court-1', 'owner-1', 'res-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite cancelamento com mais de 2 horas de antecedência', async () => {
      const startsAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
      prisma.reservation.findFirst.mockResolvedValue({
        id: 'res-1',
        courtId: 'court-1',
        status: 'CONFIRMED',
        startsAt,
      });
      prisma.reservation.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const result = await service.cancel('court-1', 'owner-1', 'res-1');
      expect(result.status).toBe('CANCELLED');
    });

    it('rejeita cancelar uma reserva que já não está confirmada', async () => {
      prisma.reservation.findFirst.mockResolvedValue({
        id: 'res-1',
        courtId: 'court-1',
        status: 'COMPLETED',
        startsAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      });

      await expect(
        service.cancel('court-1', 'owner-1', 'res-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
