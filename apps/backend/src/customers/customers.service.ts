import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CustomerAgg {
  phone: string;
  name: string;
  playerId: string | null;
  birthDate: Date | null;
  totalReservations: number;
  totalSpent: number;
  noShowCount: number;
  lastReservationAt: Date;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(ownerId: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: { court: { ownerId }, status: { not: 'CANCELLED' } },
      select: {
        startsAt: true,
        priceSnapshot: true,
        status: true,
        guestName: true,
        guestPhone: true,
        player: {
          select: { id: true, name: true, phone: true, birthDate: true },
        },
      },
      orderBy: { startsAt: 'desc' },
    });

    const byPhone = new Map<string, CustomerAgg>();

    for (const reservation of reservations) {
      const phone = reservation.player?.phone ?? reservation.guestPhone;
      if (!phone) continue;

      let customer = byPhone.get(phone);
      if (!customer) {
        customer = {
          phone,
          name: reservation.player?.name ?? reservation.guestName ?? 'Cliente',
          playerId: reservation.player?.id ?? null,
          birthDate: reservation.player?.birthDate ?? null,
          totalReservations: 0,
          totalSpent: 0,
          noShowCount: 0,
          lastReservationAt: reservation.startsAt,
        };
        byPhone.set(phone, customer);
      }

      customer.totalReservations += 1;
      customer.totalSpent += Number(reservation.priceSnapshot);
      if (reservation.status === 'NO_SHOW') customer.noShowCount += 1;
    }

    const now = Date.now();

    return [...byPhone.values()]
      .map((customer) => ({
        ...customer,
        totalSpent: Math.round(customer.totalSpent * 100) / 100,
        daysSinceLastReservation: Math.floor(
          (now - customer.lastReservationAt.getTime()) / 86_400_000,
        ),
      }))
      .sort(
        (a, b) => b.lastReservationAt.getTime() - a.lastReservationAt.getTime(),
      );
  }

  async getCustomerHistory(ownerId: string, phone: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        court: { ownerId },
        OR: [{ guestPhone: phone }, { player: { phone } }],
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        priceSnapshot: true,
        court: { select: { id: true, name: true } },
      },
      orderBy: { startsAt: 'desc' },
    });

    if (reservations.length === 0) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return reservations;
  }

  async updateBirthDate(ownerId: string, playerId: string, birthDate: string) {
    const hasReservation = await this.prisma.reservation.findFirst({
      where: { playerId, court: { ownerId } },
    });

    if (!hasReservation) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.player.update({
      where: { id: playerId },
      data: { birthDate: new Date(birthDate) },
      select: { id: true, name: true, phone: true, birthDate: true },
    });
  }
}
