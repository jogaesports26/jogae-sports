import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CouponsController } from './coupons.controller';
import { PublicCouponsController } from './public-coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [AuthModule],
  controllers: [CouponsController, PublicCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
