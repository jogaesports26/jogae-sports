import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourtsModule } from '../courts/courts.module';
import { ReservationsController } from './reservations.controller';
import { OverviewController } from './overview.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuthModule, CourtsModule],
  controllers: [ReservationsController, OverviewController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
