import { Controller, Get, Param } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

@Controller('public/estabelecimentos')
export class PublicEstablishmentController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.reservationsService.getEstablishmentBySlug(slug);
  }
}
