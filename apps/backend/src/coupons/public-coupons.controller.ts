import { Body, Controller, Param, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Controller('public/courts/:courtId/coupons')
export class PublicCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  async validate(
    @Param('courtId') courtId: string,
    @Body() dto: ValidateCouponDto,
  ) {
    const coupon = await this.couponsService.validateForCourt(
      courtId,
      dto.code,
    );

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    };
  }
}
