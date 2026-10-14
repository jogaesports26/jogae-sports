import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { ReservationEquipmentItemDto } from './dto/reservation-equipment-item.dto';

export interface ResolvedEquipmentItem {
  equipmentId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface ResolvedEquipment {
  total: number;
  records: ResolvedEquipmentItem[];
}

const WITH_COURT_IDS = { courts: { select: { id: true } } } as const;

/** Troca a relação `courts` por `courtIds` (lista vazia = vale para todas as quadras do dono). */
function withCourtIds<T extends { courts: { id: string }[] }>(equipment: T) {
  const { courts, ...rest } = equipment;
  return { ...rest, courtIds: courts.map((court) => court.id) };
}

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByOwner(ownerId: string) {
    const list = await this.prisma.equipment.findMany({
      where: { ownerId },
      include: WITH_COURT_IDS,
      orderBy: { name: 'asc' },
    });
    return list.map(withCourtIds);
  }

  /** Todas as quadras informadas precisam ser do dono: um dono não vincula equipamento a quadra de outro. */
  private async assertCourtsBelongToOwner(ownerId: string, courtIds: string[]) {
    const unique = [...new Set(courtIds)];
    if (unique.length === 0) return unique;
    const found = await this.prisma.court.count({
      where: { id: { in: unique }, ownerId },
    });
    if (found !== unique.length) {
      throw new BadRequestException('Quadra inválida para este equipamento');
    }
    return unique;
  }

  async create(ownerId: string, dto: CreateEquipmentDto) {
    const courtIds = await this.assertCourtsBelongToOwner(
      ownerId,
      dto.courtIds ?? [],
    );
    const created = await this.prisma.equipment.create({
      data: {
        ownerId,
        name: dto.name,
        pricePerUnit: dto.pricePerUnit,
        courts: { connect: courtIds.map((id) => ({ id })) },
      },
      include: WITH_COURT_IDS,
    });
    return withCourtIds(created);
  }

  async update(ownerId: string, id: string, dto: UpdateEquipmentDto) {
    await this.findOneOrThrow(id, ownerId);

    const { courtIds, ...fields } = dto;
    const ids =
      courtIds === undefined
        ? undefined
        : await this.assertCourtsBelongToOwner(ownerId, courtIds);

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: {
        ...fields,
        ...(ids === undefined
          ? {}
          : { courts: { set: ids.map((courtId) => ({ id: courtId })) } }),
      },
      include: WITH_COURT_IDS,
    });
    return withCourtIds(updated);
  }

  async remove(ownerId: string, id: string) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.equipment.update({
      where: { id },
      data: { active: false },
    });
  }

  async findOneOrThrow(id: string, ownerId: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, ownerId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    return equipment;
  }

  async findActiveForCourt(courtId: string) {
    const court = await this.prisma.court.findFirst({
      where: { id: courtId, active: true },
      select: { ownerId: true },
    });

    if (!court) {
      throw new NotFoundException('Quadra não encontrada');
    }

    return this.prisma.equipment.findMany({
      where: {
        ownerId: court.ownerId,
        active: true,
        // Sem nenhuma quadra marcada = vale para todas; senão, só nas marcadas.
        OR: [{ courts: { none: {} } }, { courts: { some: { id: courtId } } }],
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Com `courtId`, só aceita equipamento disponível nessa quadra (a validação do servidor, não só da tela). */
  async resolveForOwner(
    ownerId: string,
    items?: ReservationEquipmentItemDto[],
    courtId?: string,
  ): Promise<ResolvedEquipment> {
    if (!items || items.length === 0) {
      return { total: 0, records: [] };
    }

    const ids = [...new Set(items.map((item) => item.equipmentId))];
    const equipment = await this.prisma.equipment.findMany({
      where: { id: { in: ids }, ownerId, active: true },
      include: WITH_COURT_IDS,
    });
    const byId = new Map(equipment.map((item) => [item.id, item]));

    let total = 0;
    const records = items.map((item) => {
      const found = byId.get(item.equipmentId);
      if (!found) {
        throw new BadRequestException(
          'Equipamento não encontrado ou indisponível',
        );
      }
      if (
        courtId &&
        found.courts.length > 0 &&
        !found.courts.some((court) => court.id === courtId)
      ) {
        throw new BadRequestException(
          'Esse equipamento não está disponível nessa quadra',
        );
      }
      const unitPrice = Number(found.pricePerUnit);
      total += unitPrice * item.quantity;
      return {
        equipmentId: found.id,
        name: found.name,
        unitPrice,
        quantity: item.quantity,
      };
    });

    return { total: Math.round(total * 100) / 100, records };
  }

  async resolveForCourt(
    courtId: string,
    items?: ReservationEquipmentItemDto[],
  ): Promise<ResolvedEquipment> {
    if (!items || items.length === 0) {
      return { total: 0, records: [] };
    }

    const court = await this.prisma.court.findFirst({
      where: { id: courtId, active: true },
      select: { ownerId: true },
    });

    if (!court) {
      throw new NotFoundException('Quadra não encontrada');
    }

    return this.resolveForOwner(court.ownerId, items, courtId);
  }
}
