import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ReservationReminderScheduler } from './reservation-reminder.scheduler';

@Module({
  providers: [NotificationsService, ReservationReminderScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
