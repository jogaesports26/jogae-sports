import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('me/reservations/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') reservationId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createForPlayer(user.sub, reservationId, dto);
  }

  @Get('public/courts/:id/reviews')
  list(@Param('id') courtId: string) {
    return this.reviewsService.listForCourt(courtId);
  }
}
