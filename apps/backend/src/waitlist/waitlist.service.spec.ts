import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

describe('WaitlistService.join', () => {
  const HOUR = 3_600_000;
  const dto = (startsAt: Date, endsAt: Date) => ({
    name: 'Cliente',
    phone: '11999990000',
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });

  function build(court: unknown = { id: 'c1' }) {
    const prisma = {
      court: { findFirst: jest.fn().mockResolvedValue(court) },
      waitlist: { create: jest.fn().mockResolvedValue({ id: 'w1' }) },
    };
    const service = new WaitlistService(
      prisma as never,
      {} as never,
      {} as never,
    );
    return { service, prisma };
  }

  it('recusa entrar na fila de um horário que já passou', async () => {
    const { service, prisma } = build();
    const start = new Date(Date.now() - 2 * HOUR);
    await expect(
      service.join('c1', dto(start, new Date(start.getTime() + HOUR))),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.waitlist.create).not.toHaveBeenCalled();
  });

  it('aceita um horário futuro', async () => {
    const { service, prisma } = build();
    const start = new Date(Date.now() + 2 * HOUR);
    await service.join('c1', dto(start, new Date(start.getTime() + HOUR)));
    expect(prisma.waitlist.create).toHaveBeenCalledTimes(1);
  });

  it('continua recusando fim antes do início e quadra inexistente', async () => {
    const { service } = build();
    const start = new Date(Date.now() + 2 * HOUR);
    await expect(
      service.join('c1', dto(start, new Date(start.getTime() - HOUR))),
    ).rejects.toThrow(BadRequestException);
    const missing = build(null);
    await expect(
      missing.service.join('c1', dto(start, new Date(start.getTime() + HOUR))),
    ).rejects.toThrow(NotFoundException);
  });
});
