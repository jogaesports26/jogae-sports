import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';

function buildPrismaMock() {
  return {
    reservation: { findFirst: jest.fn() },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };
}

describe('ReviewsService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: ReviewsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new ReviewsService(prisma as any);
  });

  it('rejeita avaliar uma reserva que não é do jogador', async () => {
    prisma.reservation.findFirst.mockResolvedValue(null);

    await expect(
      service.createForPlayer('player-1', 'res-1', { rating: 5 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejeita avaliar uma reserva que ainda não foi concluída', async () => {
    prisma.reservation.findFirst.mockResolvedValue({
      id: 'res-1',
      courtId: 'court-1',
      status: 'CONFIRMED',
      review: null,
    });

    await expect(
      service.createForPlayer('player-1', 'res-1', { rating: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita avaliar a mesma reserva duas vezes', async () => {
    prisma.reservation.findFirst.mockResolvedValue({
      id: 'res-1',
      courtId: 'court-1',
      status: 'COMPLETED',
      review: { id: 'review-existente' },
    });

    await expect(
      service.createForPlayer('player-1', 'res-1', { rating: 5 }),
    ).rejects.toThrow(ConflictException);
  });

  it('cria a avaliação quando a reserva está concluída e ainda não foi avaliada', async () => {
    prisma.reservation.findFirst.mockResolvedValue({
      id: 'res-1',
      courtId: 'court-1',
      status: 'COMPLETED',
      review: null,
    });
    prisma.review.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'review-1', ...data }),
    );

    const result = await service.createForPlayer('player-1', 'res-1', {
      rating: 4,
      comment: 'Muito boa!',
    });

    expect(result.rating).toBe(4);
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reservationId: 'res-1',
          courtId: 'court-1',
          playerId: 'player-1',
        }),
      }),
    );
  });

  it('rejeita responder uma avaliação que não pertence ao dono', async () => {
    prisma.review.findFirst.mockResolvedValue(null);

    await expect(
      service.replyAsOwner('owner-1', 'review-1', { reply: 'Obrigado!' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('salva a resposta do dono numa avaliação', async () => {
    prisma.review.findFirst.mockResolvedValue({ id: 'review-1' });
    prisma.review.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'review-1', ...data }),
    );

    const result = await service.replyAsOwner('owner-1', 'review-1', {
      reply: 'Obrigado pela avaliação!',
    });

    expect(result.ownerReply).toBe('Obrigado pela avaliação!');
    expect(result.ownerRepliedAt).toBeInstanceOf(Date);
  });

  it('limpa a resposta quando o dono envia texto vazio', async () => {
    prisma.review.findFirst.mockResolvedValue({ id: 'review-1' });
    prisma.review.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'review-1', ...data }),
    );

    const result = await service.replyAsOwner('owner-1', 'review-1', {
      reply: '   ',
    });

    expect(result.ownerReply).toBeNull();
    expect(result.ownerRepliedAt).toBeNull();
  });
});
