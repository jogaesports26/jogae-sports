import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';

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

  @Get('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COURT_OWNER')
  listForOwner(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.listForOwner(user.sub);
  }

  @Patch('reviews/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COURT_OWNER')
  reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyAsOwner(user.sub, id, dto);
  }
}
