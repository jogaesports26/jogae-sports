import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { UpsertPriceRulesDto } from './dto/upsert-price-rule.dto';
import { UpsertRecurringMaintenanceBlocksDto } from './dto/upsert-recurring-maintenance-block.dto';

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByOwner(ownerId: string) {
    return this.prisma.court.findMany({
      where: { ownerId },
      include: { priceRules: true, recurringMaintenanceBlocks: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneOrThrow(id: string, ownerId: string) {
    const court = await this.prisma.court.findFirst({
      where: { id, ownerId },
      include: {
        priceRules: true,
        recurringMaintenanceBlocks: true,
      },
    });

    if (!court) {
      throw new NotFoundException('Quadra não encontrada');
    }

    return court;
  }

  create(ownerId: string, dto: CreateCourtDto) {
    return this.prisma.court.create({
      data: {
        ownerId,
        name: dto.name,
        sport: dto.sport,
        surfaceType: dto.surfaceType,
        hasLighting: dto.hasLighting ?? false,
        photoUrls: dto.photoUrls ?? [],
      },
    });
  }

  async update(id: string, ownerId: string, dto: UpdateCourtDto) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.court.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, ownerId: string) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.court.update({
      where: { id },
      data: { active: false },
    });
  }

  async replacePriceRules(
    id: string,
    ownerId: string,
    dto: UpsertPriceRulesDto,
  ) {
    await this.findOneOrThrow(id, ownerId);

    for (const rule of dto.rules) {
      if (rule.endMinute <= rule.startMinute) {
        throw new BadRequestException(
          'O horário final da regra de preço deve ser depois do horário inicial',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.priceRule.deleteMany({ where: { courtId: id } });

      if (dto.rules.length === 0) {
        return [];
      }

      await tx.priceRule.createMany({
        data: dto.rules.map((rule) => ({
          courtId: id,
          dayOfWeek: rule.dayOfWeek,
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
          pricePerHour: rule.pricePerHour,
        })),
      });

      return tx.priceRule.findMany({
        where: { courtId: id },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }

  async replaceRecurringMaintenanceBlocks(
    id: string,
    ownerId: string,
    dto: UpsertRecurringMaintenanceBlocksDto,
  ) {
    await this.findOneOrThrow(id, ownerId);

    for (const block of dto.blocks) {
      if (block.endMinute <= block.startMinute) {
        throw new BadRequestException(
          'O horário final do bloqueio deve ser depois do horário inicial',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.recurringMaintenanceBlock.deleteMany({ where: { courtId: id } });

      if (dto.blocks.length === 0) {
        return [];
      }

      await tx.recurringMaintenanceBlock.createMany({
        data: dto.blocks.map((block) => ({
          courtId: id,
          dayOfWeek: block.dayOfWeek,
          startMinute: block.startMinute,
          endMinute: block.endMinute,
          reason: block.reason,
        })),
      });

      return tx.recurringMaintenanceBlock.findMany({
        where: { courtId: id },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }
}
