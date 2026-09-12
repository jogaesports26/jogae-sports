import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlayerAuthController } from './player-auth.controller';
import { PlayerAuthService } from './player-auth.service';

@Module({
  imports: [AuthModule],
  controllers: [PlayerAuthController],
  providers: [PlayerAuthService],
})
export class PlayerAuthModule {}
