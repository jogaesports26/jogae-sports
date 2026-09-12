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
  @Roles('COURT_OWNER')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
  ) {
    return this.waitlistService.listForOwner(courtId, user.sub);
  }

  @Delete('courts/:courtId/waitlist/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COURT_OWNER')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courtId') courtId: string,
    @Param('id') id: string,
  ) {
    return this.waitlistService.remove(courtId, user.sub, id);
  }
}
