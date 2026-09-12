import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { CreateMaintenanceBlockDto } from './dto/create-maintenance-block.dto';
import { AgendaQueryDto } from './dto/agenda-query.dto';

@Controller('courts/:courtId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURT_OWNER')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('agenda')
  getAgenda(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Query() query: AgendaQueryDto,
  ) {
    return this.reservationsService.getAgenda(
      courtId,
      user.sub,
      query.weekStart,
    );
  }

  @Post('reservations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(courtId, user.sub, dto);
  }

  @Patch('reservations/:id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(
      courtId,
      user.sub,
      id,
      dto.status,
    );
  }

  @Delete('reservations/:id')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
  ) {
    return this.reservationsService.cancel(courtId, user.sub, id);
  }

  @Post('maintenance-blocks')
  createBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Body() dto: CreateMaintenanceBlockDto,
  ) {
    return this.reservationsService.createMaintenanceBlock(
      courtId,
      user.sub,
      dto,
    );
  }

  @Delete('maintenance-blocks/:id')
  removeBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
  ) {
    return this.reservationsService.removeMaintenanceBlock(
      courtId,
      user.sub,
      id,
    );
  }
}
