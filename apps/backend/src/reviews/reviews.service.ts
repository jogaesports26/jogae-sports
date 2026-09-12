import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForPlayer(
    playerId: string,
    reservationId: string,
    dto: CreateReviewDto,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, playerId },
      include: { review: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (reservation.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Só é possível avaliar reservas concluídas',
      );
    }

    if (reservation.review) {
      throw new ConflictException('Essa reserva já foi avaliada');
    }

    return this.prisma.review.create({
      data: {
        reservationId,
        courtId: reservation.courtId,
        playerId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async listForCourt(courtId: string) {
    return this.prisma.review.findMany({
      where: { courtId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        player: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(courtId: string) {
    const result = await this.prisma.review.aggregate({
      where: { courtId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating,
      reviewCount: result._count.rating,
    };
  }

  async getSummaryForCourts(courtIds: string[]) {
    const rows = await this.prisma.review.groupBy({
      by: ['courtId'],
      where: { courtId: { in: courtIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const byCourtId = new Map(
      rows.map((row) => [
        row.courtId,
        { averageRating: row._avg.rating, reviewCount: row._count.rating },
      ]),
    );

    return byCourtId;
  }
}
