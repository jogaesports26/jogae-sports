import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';
import { CreatePlayerReservationDto } from './dto/create-player-reservation.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLAYER')
export class PlayerReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('public/courts/:courtId/reservations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Body() dto: CreatePlayerReservationDto,
  ) {
    return this.reservationsService.createForPlayer(
      courtId,
      user.sub,
      dto.startsAt,
      dto.endsAt,
    );
  }

  @Get('me/reservations')
  myReservations(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.getPlayerReservations(user.sub);
  }

  @Delete('me/reservations/:id')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reservationsService.cancelForPlayer(user.sub, id);
  }
}
