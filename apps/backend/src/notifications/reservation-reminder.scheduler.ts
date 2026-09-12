import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const REMINDER_WINDOW_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class ReservationReminderScheduler {
  private readonly logger = new Logger(ReservationReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendUpcomingReminders() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: 'CONFIRMED',
        reminderSentAt: null,
        startsAt: { gte: now, lte: windowEnd },
      },
      include: {
        court: { select: { name: true } },
        player: { select: { phone: true } },
      },
    });

    for (const reservation of reservations) {
      const phone = reservation.player?.phone ?? reservation.guestPhone;
      if (!phone) continue;

      await this.notifications.notifyReservationReminder(
        phone,
        reservation.court.name,
        reservation.startsAt,
        reservation.endsAt,
      );

      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSentAt: new Date() },
      });
    }

    if (reservations.length > 0) {
      this.logger.log(`Lembretes enviados: ${reservations.length}`);
    }
  }
}
