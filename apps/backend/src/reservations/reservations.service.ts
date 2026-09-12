import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourtsService } from '../courts/courts.service';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateMaintenanceBlockDto } from './dto/create-maintenance-block.dto';

const CANCELLATION_MIN_NOTICE_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courtsService: CourtsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  async listPublicCourts() {
    const courts = await this.prisma.court.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        sport: true,
        surfaceType: true,
        hasLighting: true,
        photoUrls: true,
        owner: {
          select: { establishmentName: true, establishmentAddress: true },
        },
        priceRules: {
          select: { pricePerHour: true },
          orderBy: { pricePerHour: 'asc' },
          take: 1,
        },
      },
    });

    const ratingByCourtId = await this.reviewsService.getSummaryForCourts(
      courts.map((c) => c.id),
    );

    return courts.map((court) => ({
      ...court,
      fromPricePerHour: court.priceRules[0]?.pricePerHour ?? null,
      priceRules: undefined,
      averageRating: ratingByCourtId.get(court.id)?.averageRating ?? null,
      reviewCount: ratingByCourtId.get(court.id)?.reviewCount ?? 0,
    }));
  }

  async getPublicCourt(courtId: string) {
    const court = await this.prisma.court.findFirst({
      where: { id: courtId, active: true },
      select: {
        id: true,
        name: true,
        sport: true,
        surfaceType: true,
        hasLighting: true,
        photoUrls: true,
        owner: {
          select: {
            establishmentName: true,
            establishmentAddress: true,
            establishmentPhone: true,
          },
        },
      },
    });

    if (!court) {
      throw new NotFoundException('Quadra não encontrada');
    }

    const { averageRating, reviewCount } =
      await this.reviewsService.getSummary(courtId);

    return { ...court, averageRating, reviewCount };
  }

  async getPublicAgenda(courtId: string, weekStart: string) {
    await this.getPublicCourt(courtId);

    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const [reservations, maintenanceBlocks, priceRules] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          courtId,
          startsAt: { gte: start, lt: end },
          status: { not: 'CANCELLED' },
        },
        select: { id: true, startsAt: true, endsAt: true, status: true },
      }),
      this.prisma.maintenanceBlock.findMany({
        where: { courtId, startsAt: { gte: start, lt: end } },
      }),
      this.prisma.priceRule.findMany({
        where: { courtId },
        orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      }),
    ]);

    return { reservations, maintenanceBlocks, priceRules };
  }

  async createForPlayer(
    courtId: string,
    playerId: string,
    startsAtIso: string,
    endsAtIso: string,
  ) {
    await this.getPublicCourt(courtId);

    const startsAt = new Date(startsAtIso);
    const endsAt = new Date(endsAtIso);

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'O horário final deve ser depois do horário inicial',
      );
    }

    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Não é possível reservar um horário no passado',
      );
    }

    const priceSnapshot = await this.calculatePrice(courtId, startsAt, endsAt);
    await this.assertNoConflict(courtId, startsAt, endsAt);

    return this.prisma.reservation.create({
      data: { courtId, playerId, startsAt, endsAt, priceSnapshot },
    });
  }

  async cancelForPlayer(playerId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, playerId },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Só é possível cancelar reservas confirmadas',
      );
    }

    if (
      reservation.startsAt.getTime() - Date.now() <
      CANCELLATION_MIN_NOTICE_MS
    ) {
      throw new BadRequestException(
        'Só é possível cancelar até 2 horas antes do horário reservado',
      );
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  async getPlayerReservations(playerId: string) {
    return this.prisma.reservation.findMany({
      where: { playerId },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            owner: { select: { establishmentName: true } },
          },
        },
        review: { select: { id: true, rating: true, comment: true } },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async getTodayReservations(ownerId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: {
        court: { ownerId },
        startsAt: { gte: start, lt: end },
        status: { not: 'CANCELLED' },
      },
      include: { court: { select: { id: true, name: true } } },
      orderBy: { startsAt: 'asc' },
    });
  }

  async getAgenda(courtId: string, ownerId: string, weekStart: string) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const [reservations, maintenanceBlocks, priceRules] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { courtId, startsAt: { gte: start, lt: end } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.maintenanceBlock.findMany({
        where: { courtId, startsAt: { gte: start, lt: end } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.priceRule.findMany({
        where: { courtId },
        orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      }),
    ]);

    return { reservations, maintenanceBlocks, priceRules };
  }

  async create(courtId: string, ownerId: string, dto: CreateReservationDto) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'O horário final deve ser depois do horário inicial',
      );
    }

    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Não é possível reservar um horário no passado',
      );
    }

    const priceSnapshot = await this.calculatePrice(courtId, startsAt, endsAt);
    await this.assertNoConflict(courtId, startsAt, endsAt);

    return this.prisma.reservation.create({
      data: {
        courtId,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        startsAt,
        endsAt,
        priceSnapshot,
      },
    });
  }

  async cancel(courtId: string, ownerId: string, reservationId: string) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);
    const reservation = await this.findReservationOrThrow(
      courtId,
      reservationId,
    );

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Só é possível cancelar reservas confirmadas',
      );
    }

    if (
      reservation.startsAt.getTime() - Date.now() <
      CANCELLATION_MIN_NOTICE_MS
    ) {
      throw new BadRequestException(
        'Só é possível cancelar até 2 horas antes do horário reservado',
      );
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  async updateStatus(
    courtId: string,
    ownerId: string,
    reservationId: string,
    status: 'COMPLETED' | 'NO_SHOW',
  ) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);
    const reservation = await this.findReservationOrThrow(
      courtId,
      reservationId,
    );

    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Só reservas confirmadas podem ter o status atualizado',
      );
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
    });
  }

  async createMaintenanceBlock(
    courtId: string,
    ownerId: string,
    dto: CreateMaintenanceBlockDto,
  ) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'O horário final deve ser depois do horário inicial',
      );
    }

    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        courtId,
        status: { not: 'CANCELLED' },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (overlapping) {
      throw new ConflictException(
        'Existe uma reserva confirmada nesse período — cancele-a antes de bloquear o horário',
      );
    }

    return this.prisma.maintenanceBlock.create({
      data: { courtId, startsAt, endsAt, reason: dto.reason },
    });
  }

  async removeMaintenanceBlock(
    courtId: string,
    ownerId: string,
    blockId: string,
  ) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const block = await this.prisma.maintenanceBlock.findFirst({
      where: { id: blockId, courtId },
    });
    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return this.prisma.maintenanceBlock.delete({ where: { id: blockId } });
  }

  private async findReservationOrThrow(courtId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, courtId },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return reservation;
  }

  private async assertNoConflict(
    courtId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const overlappingReservation = await this.prisma.reservation.findFirst({
      where: {
        courtId,
        status: { not: 'CANCELLED' },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (overlappingReservation) {
      throw new ConflictException('Já existe uma reserva nesse horário');
    }

    const overlappingBlock = await this.prisma.maintenanceBlock.findFirst({
      where: { courtId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });

    if (overlappingBlock) {
      throw new ConflictException(
        'Esse horário está bloqueado para manutenção',
      );
    }
  }

  private toMinutesSinceMidnight(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  private async calculatePrice(
    courtId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<number> {
    if (startsAt.toDateString() !== endsAt.toDateString()) {
      throw new BadRequestException(
        'A reserva não pode ultrapassar a meia-noite',
      );
    }

    const dayOfWeek = startsAt.getDay();
    const startMinute = this.toMinutesSinceMidnight(startsAt);
    const endMinute = this.toMinutesSinceMidnight(endsAt);

    const rules = await this.prisma.priceRule.findMany({
      where: { courtId, dayOfWeek },
      orderBy: { startMinute: 'asc' },
    });

    let cursor = startMinute;
    let total = 0;

    while (cursor < endMinute) {
      const rule = rules.find((r) => r.startMinute === cursor);
      if (!rule) {
        throw new BadRequestException(
          'Esse horário não está disponível para reserva nessa quadra',
        );
      }

      const segmentEnd = Math.min(rule.endMinute, endMinute);
      const hours = (segmentEnd - cursor) / 60;
      total += Number(rule.pricePerHour) * hours;
      cursor = rule.endMinute;
    }

    if (cursor !== endMinute) {
      throw new BadRequestException(
        'O horário final da reserva precisa coincidir com o fim de uma faixa de preço',
      );
    }

    return Math.round(total * 100) / 100;
  }
}
