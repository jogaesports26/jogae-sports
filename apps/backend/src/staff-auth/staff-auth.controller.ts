import { Throttle } from '@nestjs/throttler';
import { Body, Controller, Post } from '@nestjs/common';
import { StaffAuthService } from './staff-auth.service';
import { StaffLoginDto } from './dto/staff-login.dto';

@Controller('staff-auth')
export class StaffAuthController {
  constructor(private readonly staffAuthService: StaffAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: StaffLoginDto) {
    return this.staffAuthService.login(dto);
  }
}
