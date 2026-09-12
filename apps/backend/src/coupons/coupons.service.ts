import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Coupon } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByOwner(ownerId: string) {
    return this.prisma.coupon.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, dto: CreateCouponDto) {
    if (dto.discountType === 'PERCENT' && dto.discountValue > 100) {
      throw new BadRequestException(
        'Desconto percentual não pode passar de 100',
      );
    }

    try {
      return await this.prisma.coupon.create({
        data: {
          ownerId,
          code: dto.code.toUpperCase(),
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          usageLimit: dto.usageLimit,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um cupom com esse código');
      }
      throw error;
    }
  }

  async update(ownerId: string, id: string, dto: UpdateCouponDto) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.coupon.update({
      where: { id },
      data: {
        active: dto.active,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        usageLimit: dto.usageLimit,
      },
    });
  }

  async remove(ownerId: string, id: string) {
    const coupon = await this.findOneOrThrow(id, ownerId);

    if (coupon.usageCount > 0) {
      throw new ConflictException(
        'Esse cupom já foi usado — desative-o em vez de remover',
      );
    }

    return this.prisma.coupon.delete({ where: { id } });
  }

  /** Valida um cupom pra um dono específico e devolve a linha — usado pelo fluxo de reserva. */
  async validateForOwner(
    ownerId: string,
    code: string,
    at: Date = new Date(),
  ): Promise<Coupon> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { ownerId_code: { ownerId, code: code.toUpperCase() } },
    });

    if (!coupon) {
      throw new BadRequestException('Cupom não encontrado');
    }

    this.assertUsable(coupon, at);

    return coupon;
  }

  /** Mesma validação, mas resolvendo o dono a partir de uma quadra — usado no fluxo público. */
  async validateForCourt(courtId: string, code: string, at: Date = new Date()) {
    const court = await this.prisma.court.findFirst({
      where: { id: courtId, active: true },
      select: { ownerId: true },
    });

    if (!court) {
      throw new NotFoundException('Quadra não encontrada');
    }

    return this.validateForOwner(court.ownerId, code, at);
  }

  computeDiscount(coupon: Coupon, basePrice: number): number {
    const raw =
      coupon.discountType === 'PERCENT'
        ? (basePrice * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);

    return Math.round(Math.min(raw, basePrice) * 100) / 100;
  }

  private assertUsable(coupon: Coupon, at: Date) {
    if (!coupon.active) {
      throw new BadRequestException('Esse cupom não está mais ativo');
    }

    if (coupon.validFrom && at < coupon.validFrom) {
      throw new BadRequestException('Esse cupom ainda não é válido');
    }

    if (coupon.validUntil && at > coupon.validUntil) {
      throw new BadRequestException('Esse cupom expirou');
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Esse cupom já atingiu o limite de uso');
    }
  }

  private async findOneOrThrow(id: string, ownerId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, ownerId },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return coupon;
  }
}
