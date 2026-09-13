import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthService } from './staff-auth.service';

@Module({
  imports: [AuthModule],
  controllers: [StaffAuthController],
  providers: [StaffAuthService],
})
export class StaffAuthModule {}
