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

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByOwner(ownerId: string) {
    return this.prisma.equipment.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });
  }

  create(ownerId: string, dto: CreateEquipmentDto) {
    return this.prisma.equipment.create({
      data: { ownerId, name: dto.name, pricePerUnit: dto.pricePerUnit },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateEquipmentDto) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.equipment.update({
      where: { id },
      data: dto,
    });
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
      where: { ownerId: court.ownerId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async resolveForOwner(
    ownerId: string,
    items?: ReservationEquipmentItemDto[],
  ): Promise<ResolvedEquipment> {
    if (!items || items.length === 0) {
      return { total: 0, records: [] };
    }

    const ids = [...new Set(items.map((item) => item.equipmentId))];
    const equipment = await this.prisma.equipment.findMany({
      where: { id: { in: ids }, ownerId, active: true },
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

    return this.resolveForOwner(court.ownerId, items);
  }
}
