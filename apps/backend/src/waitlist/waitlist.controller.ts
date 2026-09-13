import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StaffPermissionGuard } from '../auth/guards/staff-permission.guard';
import { RequireManage } from '../auth/decorators/require-manage.decorator';
import { CurrentOwnerId } from '../auth/decorators/current-owner-id.decorator';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@Controller()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('public/courts/:courtId/waitlist')
  join(@Param('courtId') courtId: string, @Body() dto: JoinWaitlistDto) {
    return this.waitlistService.join(courtId, dto);
  }

  @Get('courts/:courtId/waitlist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COURT_OWNER', 'STAFF')
  list(@CurrentOwnerId() ownerId: string, @Param('courtId') courtId: string) {
    return this.waitlistService.listForOwner(courtId, ownerId);
  }

  @Delete('courts/:courtId/waitlist/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, StaffPermissionGuard)
  @Roles('COURT_OWNER', 'STAFF')
  @RequireManage()
  remove(
    @CurrentOwnerId() ownerId: string,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
  ) {
    return this.waitlistService.remove(courtId, ownerId, id);
  }
}
