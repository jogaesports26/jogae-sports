import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourtsModule } from '../courts/courts.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { ReservationsController } from './reservations.controller';
import { OverviewController } from './overview.controller';
import { PublicCourtsController } from './public-courts.controller';
import { PublicEstablishmentController } from './public-establishment.controller';
import { PlayerReservationsController } from './player-reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [
    AuthModule,
    CourtsModule,
    ReviewsModule,
    NotificationsModule,
    WaitlistModule,
  ],
  controllers: [
    ReservationsController,
    OverviewController,
    PublicCourtsController,
    PublicEstablishmentController,
    PlayerReservationsController,
  ],
  providers: [ReservationsService],
})
export class ReservationsModule {}
