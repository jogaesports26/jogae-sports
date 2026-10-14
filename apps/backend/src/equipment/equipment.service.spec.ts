import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

function build() {
  const prisma: any = {
    equipment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    court: { findFirst: jest.fn(), count: jest.fn() },
  };
  return { prisma, service: new EquipmentService(prisma) };
}

const item = (id: string, courtIds: string[], extra = {}) => ({
  id,
  ownerId: 'owner-1',
  name: `Item ${id}`,
  pricePerUnit: 10,
  active: true,
  courts: courtIds.map((c) => ({ id: c })),
  ...extra,
});

describe('EquipmentService (equipamento por quadra)', () => {
  describe('listagem do dono', () => {
    it('devolve courtIds no lugar da relação courts', async () => {
      const { prisma, service } = build();
      prisma.equipment.findMany.mockResolvedValue([
        item('e1', []),
        item('e2', ['c1', 'c2']),
      ]);
      const result = await service.findAllByOwner('owner-1');
      expect(result[0]).toMatchObject({ id: 'e1', courtIds: [] });
      expect(result[1]).toMatchObject({ id: 'e2', courtIds: ['c1', 'c2'] });
      expect(result[1]).not.toHaveProperty('courts');
    });
  });

  describe('equipamentos oferecidos numa quadra', () => {
    it('filtra: sem quadra marcada vale para todas; marcadas só nelas', async () => {
      const { prisma, service } = build();
      prisma.court.findFirst.mockResolvedValue({ ownerId: 'owner-1' });
      prisma.equipment.findMany.mockResolvedValue([]);
      await service.findActiveForCourt('c1');
      expect(prisma.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ownerId: 'owner-1',
            active: true,
            OR: [{ courts: { none: {} } }, { courts: { some: { id: 'c1' } } }],
          },
        }),
      );
    });

    it('quadra inexistente ou inativa continua dando 404', async () => {
      const { prisma, service } = build();
      prisma.court.findFirst.mockResolvedValue(null);
      await expect(service.findActiveForCourt('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveForOwner (validação do servidor ao reservar)', () => {
    const items = [{ equipmentId: 'e1', quantity: 2 }];

    it('aceita equipamento sem restrição em qualquer quadra', async () => {
      const { prisma, service } = build();
      prisma.equipment.findMany.mockResolvedValue([item('e1', [])]);
      const result = await service.resolveForOwner('owner-1', items, 'c9');
      expect(result.total).toBe(20);
    });

    it('aceita equipamento ligado à quadra da reserva', async () => {
      const { prisma, service } = build();
      prisma.equipment.findMany.mockResolvedValue([item('e1', ['c1', 'c2'])]);
      const result = await service.resolveForOwner('owner-1', items, 'c2');
      expect(result.records).toHaveLength(1);
    });

    it('recusa equipamento de outra quadra, mesmo por requisição direta', async () => {
      const { prisma, service } = build();
      prisma.equipment.findMany.mockResolvedValue([item('e1', ['c1'])]);
      await expect(
        service.resolveForOwner('owner-1', items, 'c2'),
      ).rejects.toThrow('Esse equipamento não está disponível nessa quadra');
    });

    it('sem courtId (uso antigo) não restringe', async () => {
      const { prisma, service } = build();
      prisma.equipment.findMany.mockResolvedValue([item('e1', ['c1'])]);
      const result = await service.resolveForOwner('owner-1', items);
      expect(result.total).toBe(20);
    });

    it('o cálculo do total não muda (preço x quantidade, arredondado)', async () => {
      const { prisma, service } = build();
      prisma.equipment.findMany.mockResolvedValue([
        item('e1', [], { pricePerUnit: 3.33 }),
      ]);
      const result = await service.resolveForOwner('owner-1', [
        { equipmentId: 'e1', quantity: 3 },
      ]);
      expect(result.total).toBe(9.99);
    });

    it('resolveForCourt repassa a quadra para a validação', async () => {
      const { prisma, service } = build();
      prisma.court.findFirst.mockResolvedValue({ ownerId: 'owner-1' });
      prisma.equipment.findMany.mockResolvedValue([item('e1', ['c1'])]);
      await expect(service.resolveForCourt('c2', items)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cadastro e edição', () => {
    it('não vincula a quadra de outro dono', async () => {
      const { prisma, service } = build();
      prisma.court.count.mockResolvedValue(1);
      await expect(
        service.create('owner-1', {
          name: 'Raquete',
          pricePerUnit: 15,
          courtIds: ['c1', 'quadra-de-outro'],
        }),
      ).rejects.toThrow('Quadra inválida para este equipamento');
      expect(prisma.equipment.create).not.toHaveBeenCalled();
    });

    it('cria ligado às quadras informadas', async () => {
      const { prisma, service } = build();
      prisma.court.count.mockResolvedValue(2);
      prisma.equipment.create.mockResolvedValue(item('e1', ['c1', 'c2']));
      const created = await service.create('owner-1', {
        name: 'Raquete',
        pricePerUnit: 15,
        courtIds: ['c1', 'c2', 'c1'],
      });
      expect(prisma.equipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            courts: { connect: [{ id: 'c1' }, { id: 'c2' }] },
          }),
        }),
      );
      expect(created.courtIds).toEqual(['c1', 'c2']);
    });

    it('sem courtIds cria para todas as quadras (lista vazia)', async () => {
      const { prisma, service } = build();
      prisma.equipment.create.mockResolvedValue(item('e1', []));
      await service.create('owner-1', { name: 'Colete', pricePerUnit: 5 });
      expect(prisma.court.count).not.toHaveBeenCalled();
      expect(prisma.equipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ courts: { connect: [] } }),
        }),
      );
    });

    it('editar só o preço não mexe nas quadras; courtIds [] volta a valer para todas', async () => {
      const { prisma, service } = build();
      prisma.equipment.findFirst.mockResolvedValue(item('e1', ['c1']));
      prisma.equipment.update.mockResolvedValue(item('e1', ['c1']));
      await service.update('owner-1', 'e1', { pricePerUnit: 12 });
      expect(prisma.equipment.update.mock.calls[0][0].data).toEqual({
        pricePerUnit: 12,
      });

      prisma.equipment.update.mockResolvedValue(item('e1', []));
      await service.update('owner-1', 'e1', { courtIds: [] });
      expect(prisma.equipment.update.mock.calls[1][0].data).toEqual({
        courts: { set: [] },
      });
    });
  });
});
