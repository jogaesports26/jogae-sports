import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';

function buildPrismaMock() {
  const mock: any = {
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
    recurringMaintenanceBlock: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    coupon: {
      update: jest.fn(),
    },
    equipment: {
      findMany: jest.fn(),
    },
    court: { findFirst: jest.fn() },
    player: { findUnique: jest.fn() },
  };
  mock.$transaction = jest.fn((callback: (tx: unknown) => unknown) =>
    callback(mock),
  );
  return mock;
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

// Sempre o próximo sábado a partir de "agora", nunca uma data fixa — testes que
// dependem de "isso é no futuro" (ex: `startsAt.getTime() < Date.now()` no
// service) não podem travar em uma data de calendário específica que
// inevitavelmente vira passado.
function nextSaturdayAt(hour: number, minute = 0): Date {
  const date = new Date();
  // Sempre um sábado FUTURO, nunca hoje — mesmo que hoje já seja sábado. Isso
  // evita uma corrida entre chamadas com horas diferentes (ex: nextSaturdayAt(14)
  // e nextSaturdayAt(16) chamadas quando "agora" está entre as duas: uma decide
  // "já passou, pula pra semana que vem" e a outra não, gerando startsAt > endsAt).
  const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// Faixas de preço do sábado, 14:00-16:00, em dois blocos contíguos de 1h.
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
    const notificationsService = {
      notifyReservationConfirmed: jest.fn().mockResolvedValue(undefined),
      notifyReservationCancelled: jest.fn().mockResolvedValue(undefined),
    };
    const waitlistService = {
      notifyForFreedSlot: jest.fn().mockResolvedValue(null),
    };
    const instructorsService = {
      findOneOrThrow: jest.fn(),
    };
    const couponsService = {
      validateForOwner: jest.fn(),
      validateForCourt: jest.fn(),
      computeDiscount: jest.fn(),
    };
    const equipmentService = {
      resolveForOwner: jest.fn().mockResolvedValue({ total: 0, records: [] }),
      resolveForCourt: jest.fn().mockResolvedValue({ total: 0, records: [] }),
    };
    service = new ReservationsService(
      prisma,
      courtsService as any,
      reviewsService as any,
      notificationsService as any,
      waitlistService as any,
      instructorsService as any,
      couponsService as any,
      equipmentService as any,
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

      const startsAt = nextSaturdayAt(14);
      const endsAt = nextSaturdayAt(16);

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

      const startsAt = nextSaturdayAt(14);
      const endsAt = nextSaturdayAt(14, 30);

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

      const startsAt = nextSaturdayAt(14);
      const endsAt = nextSaturdayAt(16);

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
          startsAt: nextSaturdayAt(14).toISOString(),
          endsAt: nextSaturdayAt(15).toISOString(),
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
          startsAt: nextSaturdayAt(14).toISOString(),
          endsAt: nextSaturdayAt(15).toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita reserva sobreposta a um bloqueio recorrente', async () => {
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);
      prisma.recurringMaintenanceBlock.findFirst.mockResolvedValue({
        id: 'recurring-1',
      });

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: nextSaturdayAt(14).toISOString(),
          endsAt: nextSaturdayAt(15).toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cupom de desconto', () => {
    let couponsService: {
      validateForOwner: jest.Mock;
      validateForCourt: jest.Mock;
      computeDiscount: jest.Mock;
    };

    beforeEach(() => {
      couponsService = (service as any).couponsService;
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );
    });

    it('aplica um cupom válido e registra o desconto na reserva', async () => {
      const coupon = {
        id: 'coupon-1',
        discountType: 'FIXED',
        discountValue: 20,
      };
      couponsService.validateForOwner.mockResolvedValue(coupon);
      couponsService.computeDiscount.mockReturnValue(20);

      const result = await service.create('court-1', 'owner-1', {
        guestName: 'Cliente Teste',
        guestPhone: '85999998888',
        startsAt: nextSaturdayAt(14).toISOString(),
        endsAt: nextSaturdayAt(16).toISOString(),
        couponCode: 'PROMO20',
      });

      expect(couponsService.validateForOwner).toHaveBeenCalledWith(
        'owner-1',
        'PROMO20',
      );
      expect(couponsService.computeDiscount).toHaveBeenCalledWith(coupon, 180);
      expect(result.priceSnapshot).toBe(160);
      expect(result.couponId).toBe('coupon-1');
      expect(result.discountAmount).toBe(20);
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-1' },
        data: { usageCount: { increment: 1 } },
      });
    });

    it('cria a reserva sem cupom quando nenhum código é informado', async () => {
      const result = await service.create('court-1', 'owner-1', {
        guestName: 'Cliente Teste',
        guestPhone: '85999998888',
        startsAt: nextSaturdayAt(14).toISOString(),
        endsAt: nextSaturdayAt(16).toISOString(),
      });

      expect(couponsService.validateForOwner).not.toHaveBeenCalled();
      expect(prisma.coupon.update).not.toHaveBeenCalled();
      expect(result.priceSnapshot).toBe(180);
      expect(result.couponId).toBeUndefined();
    });

    it('rejeita quando o cupom informado é inválido/expirado/esgotado', async () => {
      couponsService.validateForOwner.mockRejectedValue(
        new BadRequestException('Esse cupom expirou'),
      );

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: nextSaturdayAt(14).toISOString(),
          endsAt: nextSaturdayAt(16).toISOString(),
          couponCode: 'VENCIDO',
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.reservation.create).not.toHaveBeenCalled();
      expect(prisma.coupon.update).not.toHaveBeenCalled();
    });

    it('aplica um cupom válido em createForPlayer e incrementa o uso', async () => {
      prisma.court.findFirst.mockResolvedValue({
        id: 'court-1',
        name: 'Quadra 1',
        sport: 'FUTSAL',
        surfaceType: 'QUADRA_POLIESPORTIVA',
        hasLighting: true,
        photoUrls: [],
        owner: {},
      });
      prisma.player.findUnique.mockResolvedValue({ id: 'player-1' });
      const coupon = {
        id: 'coupon-2',
        discountType: 'PERCENT',
        discountValue: 10,
      };
      couponsService.validateForCourt.mockResolvedValue(coupon);
      couponsService.computeDiscount.mockReturnValue(18);

      const result = await service.createForPlayer(
        'court-1',
        'player-1',
        nextSaturdayAt(14).toISOString(),
        nextSaturdayAt(16).toISOString(),
        'PROMO10',
      );

      expect(couponsService.validateForCourt).toHaveBeenCalledWith(
        'court-1',
        'PROMO10',
      );
      expect(result.priceSnapshot).toBe(162);
      expect(result.couponId).toBe('coupon-2');
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-2' },
        data: { usageCount: { increment: 1 } },
      });
    });
  });

  describe('aluguel de equipamento', () => {
    let equipmentService: {
      resolveForOwner: jest.Mock;
      resolveForCourt: jest.Mock;
    };

    beforeEach(() => {
      equipmentService = (service as any).equipmentService;
      prisma.priceRule.findMany.mockResolvedValue(SATURDAY_RULES);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.maintenanceBlock.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );
    });

    it('soma o valor dos itens de equipamento ao preço da reserva', async () => {
      const records = [
        { equipmentId: 'eq-1', name: 'Colete', unitPrice: 10, quantity: 2 },
      ];
      equipmentService.resolveForOwner.mockResolvedValue({
        total: 20,
        records,
      });

      const result = await service.create('court-1', 'owner-1', {
        guestName: 'Cliente Teste',
        guestPhone: '85999998888',
        startsAt: nextSaturdayAt(14).toISOString(),
        endsAt: nextSaturdayAt(16).toISOString(),
        equipmentItems: [{ equipmentId: 'eq-1', quantity: 2 }],
      });

      expect(equipmentService.resolveForOwner).toHaveBeenCalledWith('owner-1', [
        { equipmentId: 'eq-1', quantity: 2 },
      ]);
      expect(result.priceSnapshot).toBe(200);
      expect(result.equipmentItems).toEqual({ create: records });
    });

    it('cria a reserva sem itens quando nenhum equipamento é informado', async () => {
      const result = await service.create('court-1', 'owner-1', {
        guestName: 'Cliente Teste',
        guestPhone: '85999998888',
        startsAt: nextSaturdayAt(14).toISOString(),
        endsAt: nextSaturdayAt(16).toISOString(),
      });

      expect(equipmentService.resolveForOwner).toHaveBeenCalledWith(
        'owner-1',
        undefined,
      );
      expect(result.priceSnapshot).toBe(180);
      expect(result.equipmentItems).toEqual({ create: [] });
    });

    it('aplica cupom e equipamento juntos — desconto só no preço da quadra', async () => {
      const couponsService = (service as any).couponsService as {
        validateForOwner: jest.Mock;
        computeDiscount: jest.Mock;
      };
      const coupon = {
        id: 'coupon-1',
        discountType: 'FIXED',
        discountValue: 20,
      };
      couponsService.validateForOwner.mockResolvedValue(coupon);
      couponsService.computeDiscount.mockReturnValue(20);
      equipmentService.resolveForOwner.mockResolvedValue({
        total: 15,
        records: [
          { equipmentId: 'eq-1', name: 'Bola', unitPrice: 15, quantity: 1 },
        ],
      });

      const result = await service.create('court-1', 'owner-1', {
        guestName: 'Cliente Teste',
        guestPhone: '85999998888',
        startsAt: nextSaturdayAt(14).toISOString(),
        endsAt: nextSaturdayAt(16).toISOString(),
        couponCode: 'PROMO20',
        equipmentItems: [{ equipmentId: 'eq-1', quantity: 1 }],
      });

      // 180 (quadra) - 20 (desconto) + 15 (equipamento, sem desconto) = 175
      expect(result.priceSnapshot).toBe(175);
    });

    it('rejeita quando o item de equipamento é inválido ou indisponível', async () => {
      equipmentService.resolveForOwner.mockRejectedValue(
        new BadRequestException('Equipamento não encontrado ou indisponível'),
      );

      await expect(
        service.create('court-1', 'owner-1', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: nextSaturdayAt(14).toISOString(),
          endsAt: nextSaturdayAt(16).toISOString(),
          equipmentItems: [{ equipmentId: 'eq-inexistente', quantity: 1 }],
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('aplica equipamento em createForPlayer', async () => {
      prisma.court.findFirst.mockResolvedValue({
        id: 'court-1',
        name: 'Quadra 1',
        sport: 'FUTSAL',
        surfaceType: 'QUADRA_POLIESPORTIVA',
        hasLighting: true,
        photoUrls: [],
        owner: {},
      });
      prisma.player.findUnique.mockResolvedValue({ id: 'player-1' });
      equipmentService.resolveForCourt.mockResolvedValue({
        total: 10,
        records: [
          { equipmentId: 'eq-1', name: 'Colete', unitPrice: 10, quantity: 1 },
        ],
      });

      const result = await service.createForPlayer(
        'court-1',
        'player-1',
        nextSaturdayAt(14).toISOString(),
        nextSaturdayAt(16).toISOString(),
        undefined,
        [{ equipmentId: 'eq-1', quantity: 1 }],
      );

      expect(equipmentService.resolveForCourt).toHaveBeenCalledWith('court-1', [
        { equipmentId: 'eq-1', quantity: 1 },
      ]);
      expect(result.priceSnapshot).toBe(190);
    });
  });

  describe('isolamento por dono', () => {
    it('rejeita operar numa quadra que não pertence ao dono autenticado', async () => {
      await expect(
        service.create('court-1', 'outro-dono', {
          guestName: 'Cliente Teste',
          guestPhone: '85999998888',
          startsAt: nextSaturdayAt(14).toISOString(),
          endsAt: nextSaturdayAt(15).toISOString(),
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
        nextSaturdayAt(14).toISOString(),
        nextSaturdayAt(16).toISOString(),
      );

      expect(result.priceSnapshot).toBe(180);
    });

    it('rejeita com 401 quando o jogador do token não existe mais (sessão obsoleta)', async () => {
      prisma.player.findUnique.mockResolvedValue(null);

      await expect(
        service.createForPlayer(
          'court-1',
          'player-fantasma',
          nextSaturdayAt(14).toISOString(),
          nextSaturdayAt(16).toISOString(),
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
