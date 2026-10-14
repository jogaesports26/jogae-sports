import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import {
  DEFAULT_PAGE_SIZE,
  INACTIVE_THRESHOLD_DAYS,
  NO_SHOW_ALERT_THRESHOLD,
  type CustomerFilter,
} from './customers.constants';

const DAY_MS = 86_400_000;

export interface CustomerItem {
  phone: string;
  name: string;
  playerId: string | null;
  birthDate: Date | null;
  /** Só reservas que já começaram (as futuras ficam em `upcomingReservations`). */
  totalReservations: number;
  totalSpent: number;
  noShowCount: number;
  /** A reserva mais recente que já começou; null se o cliente só tem reservas futuras. */
  lastReservationAt: Date | null;
  nextReservationAt: Date | null;
  upcomingReservations: number;
  /** Dias desde a última reserva que já aconteceu; null se ainda não jogou. Nunca negativo. */
  daysSinceLastReservation: number | null;
}

export interface CustomersQuery {
  q?: string;
  filtro?: CustomerFilter;
  pagina?: number;
  porPagina?: number;
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function isInactive(customer: CustomerItem) {
  return (
    customer.daysSinceLastReservation !== null &&
    customer.daysSinceLastReservation >= INACTIVE_THRESHOLD_DAYS
  );
}

function hasBirthdayThisMonth(customer: CustomerItem, now: Date) {
  return (
    customer.birthDate !== null &&
    customer.birthDate.getUTCMonth() === now.getMonth()
  );
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Todos os clientes da arena, agrupados por telefone (usado pela lista, pelo resumo e pelo CSV). */
  async listCustomers(
    ownerId: string,
    now: Date = new Date(),
  ): Promise<CustomerItem[]> {
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

    const byPhone = new Map<string, CustomerItem>();

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
          lastReservationAt: null,
          nextReservationAt: null,
          upcomingReservations: 0,
          daysSinceLastReservation: null,
        };
        byPhone.set(phone, customer);
      }

      if (reservation.startsAt.getTime() <= now.getTime()) {
        customer.totalReservations += 1;
        customer.totalSpent += Number(reservation.priceSnapshot);
        if (reservation.status === 'NO_SHOW') customer.noShowCount += 1;
        // A lista vem da mais nova para a mais velha: a primeira que já começou é a última reserva.
        if (!customer.lastReservationAt) {
          customer.lastReservationAt = reservation.startsAt;
        }
      } else {
        customer.upcomingReservations += 1;
        if (
          !customer.nextReservationAt ||
          reservation.startsAt < customer.nextReservationAt
        ) {
          customer.nextReservationAt = reservation.startsAt;
        }
      }
    }

    return [...byPhone.values()]
      .map((customer) => ({
        ...customer,
        totalSpent: Math.round(customer.totalSpent * 100) / 100,
        daysSinceLastReservation: customer.lastReservationAt
          ? Math.max(
              0,
              Math.floor(
                (now.getTime() - customer.lastReservationAt.getTime()) / DAY_MS,
              ),
            )
          : null,
      }))
      .sort((a, b) => {
        const aTime = a.lastReservationAt?.getTime() ?? -Infinity;
        const bTime = b.lastReservationAt?.getTime() ?? -Infinity;
        return bTime - aTime || a.name.localeCompare(b.name, 'pt-BR');
      });
  }

  /** Lista com busca, filtro e paginação (a tela não precisa carregar todos os clientes de uma vez). */
  async listCustomersPage(
    ownerId: string,
    query: CustomersQuery,
    now: Date = new Date(),
  ) {
    const all = await this.listCustomers(ownerId, now);
    const term = normalize(query.q ?? '');
    const digits = term.replace(/\D/g, '');

    const filtered = all.filter((customer) => {
      if (term) {
        const byName = normalize(customer.name).includes(term);
        const byPhone = digits.length > 0 && customer.phone.includes(digits);
        if (!byName && !byPhone) return false;
      }
      switch (query.filtro) {
        case 'inactive':
          return isInactive(customer);
        case 'birthdays':
          return hasBirthdayThisMonth(customer, now);
        case 'noShows':
          return customer.noShowCount >= NO_SHOW_ALERT_THRESHOLD;
        default:
          return true;
      }
    });

    const porPagina = query.porPagina ?? DEFAULT_PAGE_SIZE;
    const totalPaginas = Math.max(1, Math.ceil(filtered.length / porPagina));
    const pagina = Math.min(Math.max(query.pagina ?? 1, 1), totalPaginas);

    return {
      items: filtered.slice((pagina - 1) * porPagina, pagina * porPagina),
      total: filtered.length,
      pagina,
      porPagina,
      totalPaginas,
    };
  }

  /** Contagens para as abas da lista e para o "pra ficar de olho" da tela Hoje. */
  async getSummary(ownerId: string, now: Date = new Date()) {
    const all = await this.listCustomers(ownerId, now);
    return {
      total: all.length,
      inactive: all.filter(isInactive).length,
      birthdays: all.filter((c) => hasBirthdayThisMonth(c, now)).length,
      noShows: all.filter((c) => c.noShowCount >= NO_SHOW_ALERT_THRESHOLD)
        .length,
    };
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
