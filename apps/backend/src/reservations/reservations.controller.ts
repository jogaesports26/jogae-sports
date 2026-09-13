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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StaffPermissionGuard } from '../auth/guards/staff-permission.guard';
import { RequireManage } from '../auth/decorators/require-manage.decorator';
import { CurrentOwnerId } from '../auth/decorators/current-owner-id.decorator';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { CreateMaintenanceBlockDto } from './dto/create-maintenance-block.dto';
import { UpdateMaintenanceBlockDto } from './dto/update-maintenance-block.dto';
import { AgendaQueryDto } from './dto/agenda-query.dto';

@Controller('courts/:courtId')
@UseGuards(JwtAuthGuard, RolesGuard, StaffPermissionGuard)
@Roles('COURT_OWNER')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('agenda')
  @Roles('COURT_OWNER', 'STAFF')
  getAgenda(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Query() query: AgendaQueryDto,
  ) {
    return this.reservationsService.getAgenda(
      courtId,
      ownerId,
      query.weekStart,
    );
  }

  @Post('reservations')
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  create(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(courtId, ownerId, dto);
  }

  @Patch('reservations/:id/status')
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  updateStatus(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(
      courtId,
      ownerId,
      id,
      dto.status,
    );
  }

  @Delete('reservations/:id')
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  cancel(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
  ) {
    return this.reservationsService.cancel(courtId, ownerId, id);
  }

  @Post('maintenance-blocks')
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  createBlock(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Body() dto: CreateMaintenanceBlockDto,
  ) {
    return this.reservationsService.createMaintenanceBlock(
      courtId,
      ownerId,
      dto,
    );
  }

  @Delete('maintenance-blocks/:id')
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  removeBlock(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
  ) {
    return this.reservationsService.removeMaintenanceBlock(
      courtId,
      ownerId,
      id,
    );
  }

  @Get('maintenance-blocks')
  @Roles('COURT_OWNER', 'STAFF')
  listMaintenanceHistory(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
  ) {
    return this.reservationsService.listMaintenanceHistory(courtId, ownerId);
  }

  @Patch('maintenance-blocks/:id')
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  updateBlock(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceBlockDto,
  ) {
    return this.reservationsService.updateMaintenanceBlock(
      courtId,
      ownerId,
      id,
      dto,
    );
  }
}
