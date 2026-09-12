import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlayerAuthService } from './player-auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdatePlayerNameDto } from './dto/update-player-name.dto';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('player-auth')
export class PlayerAuthController {
  constructor(private readonly playerAuthService: PlayerAuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.playerAuthService.requestOtp(dto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.playerAuthService.verifyOtp(dto.phone, dto.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.playerAuthService.getProfile(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  updateName(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlayerNameDto,
  ) {
    return this.playerAuthService.updateName(user.sub, dto.name);
  }
}
