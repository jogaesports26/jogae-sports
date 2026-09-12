import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourtsModule } from '../courts/courts.module';
import { ReservationsController } from './reservations.controller';
import { OverviewController } from './overview.controller';
import { PublicCourtsController } from './public-courts.controller';
import { PlayerReservationsController } from './player-reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuthModule, CourtsModule],
  controllers: [
    ReservationsController,
    OverviewController,
    PublicCourtsController,
    PlayerReservationsController,
  ],
  providers: [ReservationsService],
})
export class ReservationsModule {}
