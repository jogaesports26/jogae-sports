import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURT_OWNER')
export class OverviewController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.getTodayReservations(user.sub);
  }
}
