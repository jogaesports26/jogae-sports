import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourtsService } from '../courts/courts.service';
import { ReviewsService } from '../reviews/reviews.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateMaintenanceBlockDto } from './dto/create-maintenance-block.dto';
import { UpdateMaintenanceBlockDto } from './dto/update-maintenance-block.dto';

const CANCELLATION_MIN_NOTICE_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courtsService: CourtsService,
    private readonly reviewsService: ReviewsService,
    private readonly notificationsService: NotificationsService,
    private readonly waitlistService: WaitlistService,
  ) {}

  async getEstablishmentBySlug(slug: string) {
    const owner = await this.prisma.user.findUnique({
      where: { establishmentSlug: slug },
      select: {
        establishmentName: true,
        establishmentAddress: true,
        establishmentPhone: true,
        courts: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            sport: true,
            surfaceType: true,
            hasLighting: true,
            photoUrls: true,
            priceRules: {
              select: { pricePerHour: true },
              orderBy: { pricePerHour: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!owner) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    const ratingByCourtId = await this.reviewsService.getSummaryForCourts(
      owner.courts.map((c) => c.id),
    );

    return {
      establishmentName: owner.establishmentName,
      establishmentAddress: owner.establishmentAddress,
      establishmentPhone: owner.establishmentPhone,
      courts: owner.courts.map((court) => ({
        ...court,
        fromPricePerHour: court.priceRules[0]?.pricePerHour ?? null,
        priceRules: undefined,
        averageRating: ratingByCourtId.get(court.id)?.averageRating ?? null,
        reviewCount: ratingByCourtId.get(court.id)?.reviewCount ?? 0,
      })),
    };
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

    const [
      reservations,
      maintenanceBlocks,
      priceRules,
      recurringMaintenanceBlocks,
    ] = await Promise.all([
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
      this.prisma.recurringMaintenanceBlock.findMany({
        where: { courtId },
        orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      }),
    ]);

    return {
      reservations,
      maintenanceBlocks,
      priceRules,
      recurringMaintenanceBlocks,
    };
  }

  async createForPlayer(
    courtId: string,
    playerId: string,
    startsAtIso: string,
    endsAtIso: string,
  ) {
    const court = await this.getPublicCourt(courtId);

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new UnauthorizedException('Sessão do jogador expirada');
    }

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

    const reservation = await this.prisma.reservation.create({
      data: { courtId, playerId, startsAt, endsAt, priceSnapshot },
    });

    await this.notificationsService.notifyReservationConfirmed(
      player.phone,
      court.name,
      startsAt,
      endsAt,
    );

    return reservation;
  }

  async cancelForPlayer(playerId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, playerId },
      include: {
        court: { select: { name: true } },
        player: { select: { phone: true } },
      },
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

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    if (reservation.player) {
      await this.notificationsService.notifyReservationCancelled(
        reservation.player.phone,
        reservation.court.name,
        reservation.startsAt,
        reservation.endsAt,
      );
    }
    await this.waitlistService.notifyForFreedSlot(
      reservation.courtId,
      reservation.startsAt,
      reservation.endsAt,
    );

    return updated;
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

  async getReports(
    ownerId: string,
    from: string,
    to: string,
    courtId?: string,
  ) {
    const courts = await this.getOwnerCourtsForReport(ownerId, courtId);
    const courtIds = courts.map((c) => c.id);
    const { start, end } = this.parseReportRange(from, to);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        courtId: { in: courtIds },
        startsAt: { gte: start, lt: end },
        status: { not: 'CANCELLED' },
      },
      select: {
        courtId: true,
        startsAt: true,
        endsAt: true,
        priceSnapshot: true,
      },
    });

    const revenueByCourt = new Map<
      string,
      { name: string; revenue: number; reservationsCount: number }
    >();
    for (const court of courts) {
      revenueByCourt.set(court.id, {
        name: court.name,
        revenue: 0,
        reservationsCount: 0,
      });
    }

    let totalRevenue = 0;
    let reservedMinutes = 0;
    const revenueByDay = new Map<string, number>();

    for (const reservation of reservations) {
      const amount = Number(reservation.priceSnapshot);
      totalRevenue += amount;
      reservedMinutes +=
        (reservation.endsAt.getTime() - reservation.startsAt.getTime()) / 60000;

      const courtEntry = revenueByCourt.get(reservation.courtId);
      if (courtEntry) {
        courtEntry.revenue += amount;
        courtEntry.reservationsCount += 1;
      }

      const dayKey = reservation.startsAt.toISOString().slice(0, 10);
      revenueByDay.set(dayKey, (revenueByDay.get(dayKey) ?? 0) + amount);
    }

    const availableMinutes = this.calculateAvailableMinutes(courts, start, end);
    const occupancyRate =
      availableMinutes > 0
        ? Math.min(reservedMinutes / availableMinutes, 1)
        : 0;

    const courtsReport = [...revenueByCourt.entries()]
      .map(([id, value]) => ({
        courtId: id,
        courtName: value.name,
        revenue: this.round2(value.revenue),
        reservationsCount: value.reservationsCount,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const dailyRevenue = [...revenueByDay.entries()]
      .map(([date, revenue]) => ({ date, revenue: this.round2(revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      from,
      to,
      totalRevenue: this.round2(totalRevenue),
      reservationsCount: reservations.length,
      occupancyRate: Math.round(occupancyRate * 1000) / 1000,
      courts: courtsReport,
      dailyRevenue,
    };
  }

  async getReportRows(
    ownerId: string,
    from: string,
    to: string,
    courtId?: string,
  ) {
    const courts = await this.getOwnerCourtsForReport(ownerId, courtId);
    const courtIds = courts.map((c) => c.id);
    const courtNameById = new Map(courts.map((c) => [c.id, c.name]));
    const { start, end } = this.parseReportRange(from, to);

    const reservations = await this.prisma.reservation.findMany({
      where: { courtId: { in: courtIds }, startsAt: { gte: start, lt: end } },
      orderBy: { startsAt: 'asc' },
    });

    return reservations.map((reservation) => ({
      ...reservation,
      courtName: courtNameById.get(reservation.courtId) ?? '',
    }));
  }

  async getAgenda(courtId: string, ownerId: string, weekStart: string) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const start = new Date(`${weekStart}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const [
      reservations,
      maintenanceBlocks,
      priceRules,
      recurringMaintenanceBlocks,
    ] = await Promise.all([
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
      this.prisma.recurringMaintenanceBlock.findMany({
        where: { courtId },
        orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      }),
    ]);

    return {
      reservations,
      maintenanceBlocks,
      priceRules,
      recurringMaintenanceBlocks,
    };
  }

  async create(courtId: string, ownerId: string, dto: CreateReservationDto) {
    const court = await this.courtsService.findOneOrThrow(courtId, ownerId);

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

    const reservation = await this.prisma.reservation.create({
      data: {
        courtId,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        startsAt,
        endsAt,
        priceSnapshot,
      },
    });

    await this.notificationsService.notifyReservationConfirmed(
      dto.guestPhone,
      court.name,
      startsAt,
      endsAt,
    );

    return reservation;
  }

  async cancel(courtId: string, ownerId: string, reservationId: string) {
    const court = await this.courtsService.findOneOrThrow(courtId, ownerId);
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

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    const phone = reservation.player?.phone ?? reservation.guestPhone;
    if (phone) {
      await this.notificationsService.notifyReservationCancelled(
        phone,
        court.name,
        reservation.startsAt,
        reservation.endsAt,
      );
    }
    await this.waitlistService.notifyForFreedSlot(
      courtId,
      reservation.startsAt,
      reservation.endsAt,
    );

    return updated;
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

  async listMaintenanceHistory(courtId: string, ownerId: string) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    return this.prisma.maintenanceBlock.findMany({
      where: { courtId },
      orderBy: { startsAt: 'desc' },
    });
  }

  async updateMaintenanceBlock(
    courtId: string,
    ownerId: string,
    blockId: string,
    dto: UpdateMaintenanceBlockDto,
  ) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const block = await this.prisma.maintenanceBlock.findFirst({
      where: { id: blockId, courtId },
    });
    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return this.prisma.maintenanceBlock.update({
      where: { id: blockId },
      data: {
        cost: dto.cost,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
    });
  }

  private async findReservationOrThrow(courtId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, courtId },
      include: { player: { select: { phone: true } } },
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

    const dayOfWeek = startsAt.getDay();
    const startMinute = this.toMinutesSinceMidnight(startsAt);
    const endMinute = this.toMinutesSinceMidnight(endsAt);

    const overlappingRecurringBlock =
      await this.prisma.recurringMaintenanceBlock.findFirst({
        where: {
          courtId,
          dayOfWeek,
          startMinute: { lt: endMinute },
          endMinute: { gt: startMinute },
        },
      });

    if (overlappingRecurringBlock) {
      throw new ConflictException(
        'Esse horário está bloqueado para manutenção',
      );
    }
  }

  private async getOwnerCourtsForReport(ownerId: string, courtId?: string) {
    const courts = await this.prisma.court.findMany({
      where: { ownerId, ...(courtId ? { id: courtId } : {}) },
      select: {
        id: true,
        name: true,
        priceRules: {
          select: { dayOfWeek: true, startMinute: true, endMinute: true },
        },
      },
    });

    if (courtId && courts.length === 0) {
      throw new NotFoundException('Quadra não encontrada');
    }

    return courts;
  }

  private parseReportRange(from: string, to: string) {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);

    if (end <= start) {
      throw new BadRequestException(
        'O período final deve ser depois do inicial',
      );
    }

    return { start, end };
  }

  private calculateAvailableMinutes(
    courts: {
      priceRules: {
        dayOfWeek: number;
        startMinute: number;
        endMinute: number;
      }[];
    }[],
    start: Date,
    end: Date,
  ) {
    const minutesByDayOfWeek = new Map<number, number>();
    for (const court of courts) {
      for (const rule of court.priceRules) {
        const duration = rule.endMinute - rule.startMinute;
        minutesByDayOfWeek.set(
          rule.dayOfWeek,
          (minutesByDayOfWeek.get(rule.dayOfWeek) ?? 0) + duration,
        );
      }
    }

    let totalMinutes = 0;
    for (
      const cursor = new Date(start);
      cursor < end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      totalMinutes += minutesByDayOfWeek.get(cursor.getDay()) ?? 0;
    }

    return totalMinutes;
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
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
